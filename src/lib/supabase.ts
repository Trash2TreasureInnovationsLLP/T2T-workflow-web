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
