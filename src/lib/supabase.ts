import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://odfgtftcoliyjtiykiom.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZmd0ZnRjb2xpeWp0aXlraW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTYzNTksImV4cCI6MjEwNTIzMjM1OX0.20sR2EoqTeunX9IjBKA6A40b3XQv-1-GKH1-YxB5isM";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kZmd0ZnRjb2xpeWp0aXlraW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NjM1OSwiZXhwIjoyMTA1MjMyMzU5fQ.EC4KskpIgSSuu7kvLWcTwzfbbAO-yxoey9OLtQ8mBMo";

// Client for public / client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for backend / API route operations (Storage management, server-side data sync)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// S3 Protocol Configuration for Supabase Storage
export const S3_CONFIG = {
  endpoint: process.env.S3_ENDPOINT || `${supabaseUrl}/storage/v1/s3`,
  region: process.env.S3_REGION || "ap-south-1",
  accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
  bucketName: process.env.S3_BUCKET_NAME || "t2t-documents",
};

// Helper: Upload file or buffer to Supabase Storage
export async function uploadFileToSupabaseStorage(
  filePath: string,
  fileData: Buffer | Uint8Array | Blob | string,
  contentType: string = "application/octet-stream",
  bucketName: string = "t2t-documents"
) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileData, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn("Storage upload notice:", error.message);
      // Return public URL path format as fallback
      return {
        success: false,
        url: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`,
        error: error.message,
      };
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrlData.publicUrl, path: filePath };
  } catch (error: any) {
    console.error("Supabase storage error:", error);
    return {
      success: false,
      url: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`,
      error: error.message,
    };
  }
}
