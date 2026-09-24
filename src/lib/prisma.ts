import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./supabase";
import { syncAllToSupabasePostgres, pullFromSupabasePostgres } from "./supabaseDbSync";

declare global {
  var prisma: PrismaClient | undefined;
  var __lastKnownCloudTimestamp: string | null | undefined;
  var __lastCheckedCloudTime: number | undefined;
  var __lastLocalWriteTime: number | undefined;
}

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);

const localDbPath = isServerless
  ? "/tmp/dev.db"
  : path.resolve(process.cwd(), "prisma", "dev.db");

// Initial fallback on cold start
if (isServerless && !fs.existsSync(localDbPath)) {
  const candidates = [
    path.join(process.cwd(), "prisma", "dev.db"),
    path.join(process.cwd(), "dev.db"),
  ];
  for (const src of candidates) {
    if (fs.existsSync(src)) {
      try {
        const dir = path.dirname(localDbPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(src, localDbPath);
        break;
      } catch (e) {
        console.error("Failed copying bundled db to /tmp:", e);
      }
    }
  }
}

let activeSyncPromise: Promise<void> | null = null;
let activeUploadPromise: Promise<void> | null = null;

export async function syncDatabaseFromCloud(force = false): Promise<void> {
  if (!isServerless && !force) return;

  const now = Date.now();
  const lastWrite = global.__lastLocalWriteTime || 0;

  // Never overwrite local database if we recently wrote to it locally on this container
  if (!force && now - lastWrite < 5000) {
    return;
  }

  const lastCheck = global.__lastCheckedCloudTime || 0;
  // Throttle checking cloud storage to once every 5 seconds if local db exists
  if (!force && fs.existsSync(localDbPath) && now - lastCheck < 5000) {
    return;
  }
  global.__lastCheckedCloudTime = now;

  if (activeSyncPromise) return activeSyncPromise;

  activeSyncPromise = (async () => {
    try {
      const { data: listData, error: listErr } = await supabaseAdmin.storage
        .from("t2t-assets")
        .list("database");

      if (listErr || !listData) return;

      const cloudFile = listData.find((f) => f.name === "dev.db");
      if (!cloudFile) return;

      const cloudTimestamp = cloudFile.updated_at ? new Date(cloudFile.updated_at).getTime() : 0;
      const needsDownload =
        !fs.existsSync(localDbPath) ||
        (cloudFile.updated_at !== global.__lastKnownCloudTimestamp &&
          cloudTimestamp > (global.__lastLocalWriteTime || 0));

      if (needsDownload) {
        const { data: fileBlob, error: dlErr } = await supabaseAdmin.storage
          .from("t2t-assets")
          .download("database/dev.db");

        if (!dlErr && fileBlob) {
          const buffer = Buffer.from(await fileBlob.arrayBuffer());
          const dir = path.dirname(localDbPath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

          fs.writeFileSync(localDbPath, buffer);
          global.__lastKnownCloudTimestamp = cloudFile.updated_at;
          console.log(`[CloudDB] Synced ${buffer.length} bytes from cloud storage`);
        }
      }

      // Always pull any records directly from Supabase Postgres to guarantee 100% parity with Supabase Dashboard
      await pullFromSupabasePostgres().catch((e) => console.error("[CloudDB] pullFromSupabasePostgres error:", e));
    } catch (err) {
      console.error("[CloudDB] Error downloading database:", err);
    } finally {
      activeSyncPromise = null;
    }
  })();

  return activeSyncPromise;
}

export async function syncDatabaseToCloud(): Promise<void> {
  if (!fs.existsSync(localDbPath)) return;

  if (activeUploadPromise) return activeUploadPromise;

  activeUploadPromise = (async () => {
    try {
      const buffer = fs.readFileSync(localDbPath);
      const { error } = await supabaseAdmin.storage
        .from("t2t-assets")
        .upload("database/dev.db", buffer, { upsert: true, cacheControl: "0" });

      if (error) {
        console.error("[CloudDB] Error uploading database to cloud:", error);
      } else {
        const nowIso = new Date().toISOString();
        global.__lastKnownCloudTimestamp = nowIso;
        global.__lastLocalWriteTime = Date.now();
        console.log(`[CloudDB] Persisted ${buffer.length} bytes to cloud storage`);

        // Also ensure Supabase Postgres tables are synchronized
        await syncAllToSupabasePostgres().catch((e) => console.error("[SupabasePostgres] Sync failed:", e));
      }
    } catch (err) {
      console.error("[CloudDB] Error uploading database to cloud:", err);
    } finally {
      activeUploadPromise = null;
    }
  })();

  return activeUploadPromise;
}

const dbUrl = isServerless ? `file:${localDbPath}` : process.env.DATABASE_URL;

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
