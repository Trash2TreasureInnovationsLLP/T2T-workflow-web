import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { supabaseAdmin } from "./supabase";

declare global {
  var prisma: PrismaClient | undefined;
  var __lastKnownCloudTimestamp: string | null | undefined;
  var __lastCheckedCloudTime: number | undefined;
  var __lastLocalWriteTime: number | undefined;
  var __debounceUploadTimer: NodeJS.Timeout | undefined;
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

  // Never overwrite local database if we recently wrote to it locally (prevents resurrecting deleted records on refresh)
  if (!force && now - lastWrite < 15000) {
    return;
  }

  const lastCheck = global.__lastCheckedCloudTime || 0;
  // Throttle checking cloud storage to once every 15 seconds to eliminate query lag
  if (!force && now - lastCheck < 15000) {
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
      if (!cloudFile) {
        if (fs.existsSync(localDbPath)) {
          triggerDebouncedCloudSync();
        }
        return;
      }

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
      const { data: listData } = await supabaseAdmin.storage
        .from("t2t-assets")
        .list("database");

      const exists = listData?.some((f) => f.name === "dev.db");
      let res;
      if (exists) {
        res = await supabaseAdmin.storage
          .from("t2t-assets")
          .update("database/dev.db", buffer, { cacheControl: "0" });
      } else {
        res = await supabaseAdmin.storage
          .from("t2t-assets")
          .upload("database/dev.db", buffer, { upsert: true, cacheControl: "0" });
      }

      if (res?.data) {
        global.__lastKnownCloudTimestamp = new Date().toISOString();
        console.log(`[CloudDB] Persisted ${buffer.length} bytes to cloud storage`);
      }
    } catch (err) {
      console.error("[CloudDB] Error uploading database to cloud:", err);
    } finally {
      activeUploadPromise = null;
    }
  })();

  return activeUploadPromise;
}

export function triggerDebouncedCloudSync(): void {
  if (!isServerless) return;
  global.__lastLocalWriteTime = Date.now();

  if (global.__debounceUploadTimer) {
    clearTimeout(global.__debounceUploadTimer);
  }

  // Coalesce sequential writes into a single background upload
  global.__debounceUploadTimer = setTimeout(() => {
    syncDatabaseToCloud().catch((err) => {
      console.error("[CloudDB] Background sync failed:", err);
    });
  }, 500);
}

const dbUrl = isServerless ? `file:${localDbPath}` : process.env.DATABASE_URL;

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    datasources: dbUrl
      ? {
          db: {
            url: dbUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  // Attach middleware for persistent cloud synchronization across serverless lambdas
  client.$use(async (params, next) => {
    // Never interrupt, delay, or block transactions with cloud storage operations
    if (params.runInTransaction) {
      return next(params);
    }

    const isRead = [
      "findUnique",
      "findFirst",
      "findMany",
      "count",
      "aggregate",
      "groupBy",
    ].includes(params.action);

    const isWrite = [
      "create",
      "createMany",
      "update",
      "updateMany",
      "delete",
      "deleteMany",
      "upsert",
    ].includes(params.action);

    if (isRead && isServerless) {
      await syncDatabaseFromCloud();
    }

    const result = await next(params);

    // After a write, trigger background sync without delaying or blocking the response
    if (isWrite && isServerless) {
      triggerDebouncedCloudSync();
    }

    return result;
  });

  return client;
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
