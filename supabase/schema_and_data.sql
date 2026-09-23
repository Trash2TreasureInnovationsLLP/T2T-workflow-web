-- ==============================================================================
-- TRASH2TREASURE INNOVATIONS LLP - COMPLETE SUPABASE POSTGRESQL SCHEMA & DATA
-- Target: Supabase Cloud Database (PostgreSQL)
-- Project Ref: odfgtftcoliyjtiykiom
-- ==============================================================================

-- Explicitly target public schema
SET search_path TO public;

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running (safe order)
DROP TABLE IF EXISTS public."ActivityLog" CASCADE;
DROP TABLE IF EXISTS public."Document" CASCADE;
DROP TABLE IF EXISTS public."Announcement" CASCADE;
DROP TABLE IF EXISTS public."Notification" CASCADE;
DROP TABLE IF EXISTS public."Milestone" CASCADE;
DROP TABLE IF EXISTS public."TaskAttachment" CASCADE;
DROP TABLE IF EXISTS public."TaskComment" CASCADE;
DROP TABLE IF EXISTS public."Task" CASCADE;
DROP TABLE IF EXISTS public."Sprint" CASCADE;
DROP TABLE IF EXISTS public."ProjectMember" CASCADE;
DROP TABLE IF EXISTS public."Project" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."Department" CASCADE;

-- 3. Create Tables in public schema
CREATE TABLE public."Department" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "code" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "employeeId" TEXT NOT NULL UNIQUE,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT TRUE,
    "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "departmentId" TEXT REFERENCES "Department"("id") ON DELETE SET NULL,
    "designation" TEXT NOT NULL,
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joiningDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reportingManagerId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "skills" TEXT NOT NULL DEFAULT '',
    "avatarUrl" TEXT,
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_user_role" ON "User"("role");
CREATE INDEX "idx_user_department" ON "User"("departmentId");
CREATE INDEX "idx_user_account_status" ON "User"("accountStatus");

CREATE TABLE public."Project" (
    "id" TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "managerId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'HIGH',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "budget" DOUBLE PRECISION DEFAULT 0,
    "risks" TEXT DEFAULT '',
    "blockers" TEXT DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_project_status" ON "Project"("status");
CREATE INDEX "idx_project_priority" ON "Project"("priority");

CREATE TABLE public."ProjectMember" (
    "id" TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL REFERENCES public."Project"("id") ON DELETE CASCADE,
    "userId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
    "roleInProject" TEXT NOT NULL DEFAULT 'Contributor',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uniq_project_user" UNIQUE ("projectId", "userId")
);

CREATE TABLE public."Sprint" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "projectId" TEXT NOT NULL REFERENCES public."Project"("id") ON DELETE CASCADE,
    "reviewNotes" TEXT,
    "retroNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_sprint_status" ON public."Sprint"("status");
CREATE INDEX "idx_sprint_project" ON public."Sprint"("projectId");

CREATE TABLE public."Task" (
    "id" TEXT PRIMARY KEY,
    "taskId" TEXT NOT NULL UNIQUE,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectId" TEXT NOT NULL REFERENCES public."Project"("id") ON DELETE CASCADE,
    "sprintId" TEXT REFERENCES public."Sprint"("id") ON DELETE SET NULL,
    "assigneeId" TEXT REFERENCES public."User"("id") ON DELETE SET NULL,
    "createdById" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "estimatedEffort" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualEffort" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "storyPoints" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT NOT NULL DEFAULT '',
    "blockers" TEXT,
    "dependencies" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_task_status" ON public."Task"("status");
CREATE INDEX "idx_task_priority" ON public."Task"("priority");
CREATE INDEX "idx_task_project" ON public."Task"("projectId");
CREATE INDEX "idx_task_sprint" ON public."Task"("sprintId");
CREATE INDEX "idx_task_assignee" ON public."Task"("assigneeId");

CREATE TABLE public."TaskComment" (
    "id" TEXT PRIMARY KEY,
    "taskId" TEXT NOT NULL REFERENCES public."Task"("id") ON DELETE CASCADE,
    "authorId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_comment_task" ON public."TaskComment"("taskId");

CREATE TABLE public."TaskAttachment" (
    "id" TEXT PRIMARY KEY,
    "taskId" TEXT NOT NULL REFERENCES public."Task"("id") ON DELETE CASCADE,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."Milestone" (
    "id" TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL REFERENCES public."Project"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."Notification" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "read" BOOLEAN NOT NULL DEFAULT FALSE,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_notification_user_read" ON public."Notification"("userId", "read");

CREATE TABLE public."Announcement" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "authorId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
    "isPinned" BOOLEAN NOT NULL DEFAULT FALSE,
    "targetDepartmentId" TEXT REFERENCES public."Department"("id") ON DELETE SET NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."Document" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "projectId" TEXT REFERENCES public."Project"("id") ON DELETE SET NULL,
    "taskId" TEXT REFERENCES public."Task"("id") ON DELETE SET NULL,
    "sprintId" TEXT REFERENCES public."Sprint"("id") ON DELETE SET NULL,
    "uploadedById" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public."ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES public."User"("id") ON DELETE RESTRICT,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "objectTitle" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_activity_user" ON public."ActivityLog"("userId");
CREATE INDEX "idx_activity_object_type" ON public."ActivityLog"("objectType");
CREATE INDEX "idx_activity_action" ON public."ActivityLog"("action");
CREATE INDEX "idx_activity_created_at" ON public."ActivityLog"("createdAt");

-- 4. INSERT DATA (PRESERVING ALL EXISTING DATA)
INSERT INTO public."Department" ("id", "name", "code", "description", "createdAt") VALUES ('cmu9wd3oi0000uv287a9gk5g4', 'Executive Leadership', 'EXEC', 'Strategic and executive governance', '2026-09-20T14:13:54.787Z') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "code" = EXCLUDED."code";
INSERT INTO public."Department" ("id", "name", "code", "description", "createdAt") VALUES ('cmu9wd3uj0001uv28qagkdqg2', 'Technology & Engineering', 'TECH', 'Software, IoT, AI platforms, and hardware engineering', '2026-09-20T14:13:55.003Z') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "code" = EXCLUDED."code";
INSERT INTO public."Department" ("id", "name", "code", "description", "createdAt") VALUES ('cmu9wd40p0002uv28v3k6w4pe', 'Operations & Logistics', 'OPS', 'Supply chain, recycling operations, sorting facilities, and fieldwork', '2026-09-20T14:13:55.226Z') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "code" = EXCLUDED."code";
INSERT INTO public."Department" ("id", "name", "code", "description", "createdAt") VALUES ('cmu9wd4430003uv28rstpay0q', 'Finance & Accounts', 'FIN', 'Financial management, accounting, budget control, and compliance', '2026-09-20T14:13:55.347Z') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "code" = EXCLUDED."code";
INSERT INTO public."Department" ("id", "name", "code", "description", "createdAt") VALUES ('cmu9wd4aj0004uv28zi2b8cql', 'Marketing & Growth', 'MKT', 'Branding, corporate partnerships, customer acquisition, and circular impact', '2026-09-20T14:13:55.580Z') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "code" = EXCLUDED."code";
INSERT INTO public."Department" ("id", "name", "code", "description", "createdAt") VALUES ('cmu9wd4m20005uv286cgkj14b', 'Advisory Council', 'ADV', 'Strategic advisory, regulatory governance, and circular economy consultation', '2026-09-20T14:13:55.995Z') ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "code" = EXCLUDED."code";
INSERT INTO public."User" ("id", "email", "employeeId", "fullName", "passwordHash", "mustChangePassword", "role", "departmentId", "designation", "accountStatus", "joiningDate", "reportingManagerId", "skills", "avatarUrl", "lastActive", "createdAt", "updatedAt") VALUES ('cmu9wd4pm0007uv28axmhaodt', 'vishnu@trash2treasure.co.in', 'T2T-001', 'Vishnu (Super Admin)', '$2a$10$5Li2qrjpmmqvkfrPOYGzKe4lKJGtl3rXqX.OR8hkIiztvc7q7LPxa', FALSE, 'SUPER_ADMIN', 'cmu9wd3oi0000uv287a9gk5g4', 'Chief Executive Officer & Founder', 'ACTIVE', '2026-09-20T14:13:56.122Z', NULL, 'Leadership, Strategy, Circular Economy, System Architecture, Venture Building', NULL, '2026-09-20T14:13:56.122Z', '2026-09-20T14:13:56.122Z', '2026-09-20T14:13:56.122Z') ON CONFLICT ("id") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "mustChangePassword" = EXCLUDED."mustChangePassword", "lastActive" = EXCLUDED."lastActive";
INSERT INTO public."User" ("id", "email", "employeeId", "fullName", "passwordHash", "mustChangePassword", "role", "departmentId", "designation", "accountStatus", "joiningDate", "reportingManagerId", "skills", "avatarUrl", "lastActive", "createdAt", "updatedAt") VALUES ('cmu9yijei0001lpkdhgmh2odv', 'workflow_audit_user@trash2treasure.co.in', 'T2T-002', 'Workflow Audit Member', '$2a$10$uwQukFBpIPlnzGMsteCdTe4h8NOwJqq2cw/V74jqf8E4K2epm5uDy', TRUE, 'EMPLOYEE', 'cmu9wd3uj0001uv28qagkdqg2', 'Lead Circular Architect', 'ACTIVE', '2026-09-20T15:14:07.673Z', NULL, 'Python, IoT, Pyrolysis Control', NULL, '2026-09-20T15:14:07.673Z', '2026-09-20T15:14:07.673Z', '2026-09-20T15:14:07.702Z') ON CONFLICT ("id") DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash", "mustChangePassword" = EXCLUDED."mustChangePassword", "lastActive" = EXCLUDED."lastActive";
INSERT INTO public."Project" ("id", "projectId", "name", "description", "managerId", "startDate", "targetDate", "status", "priority", "progress", "budget", "risks", "blockers", "createdAt", "updatedAt") VALUES ('cmu9yijfy0003lpkdt138cnqz', 'T2T-PRJ-AUDIT', 'Automated Circular Workflow Validation', 'End-to-end verification of circular logistics, sorting pipelines, and energy recovery.', 'cmu9wd4pm0007uv28axmhaodt', '2026-09-20T15:14:07.715Z', '2026-10-20T15:14:07.715Z', 'ACTIVE', 'HIGH', 0, 1250000, '', '', '2026-09-20T15:14:07.727Z', '2026-09-20T15:14:07.727Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO public."Milestone" ("id", "projectId", "title", "description", "dueDate", "status", "completedAt", "createdAt") VALUES ('cmu9yijgb0005lpkdigmka8tg', 'cmu9yijfy0003lpkdt138cnqz', 'Phase 1: Sensor Array Calibration', NULL, '2026-09-27T15:14:07.739Z', 'IN_PROGRESS', NULL, '2026-09-20T15:14:07.740Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO public."ActivityLog" ("id", "userId", "action", "objectType", "objectId", "objectTitle", "previousValue", "newValue", "details", "createdAt") VALUES ('cmu9wd4zm0009uv28ft8fdh16', 'cmu9wd4pm0007uv28axmhaodt', 'CREATED', 'USER', 'cmu9wd4pm0007uv28axmhaodt', 'Trash2Treasure Innovations Platform Initialized', NULL, NULL, 'Database initialized for Trash2Treasure Innovations LLP with Super Admin account.', '2026-09-20T14:13:56.483Z') ON CONFLICT ("id") DO NOTHING;

-- 5. Supabase Storage Bucket Setup (S3 Compatible)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  't2t-documents',
  't2t-documents',
  true,
  52428800,
  NULL
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove broad listing policy (public URL downloads work automatically without exposing file list)
DROP POLICY IF EXISTS "Public Access for t2t-documents" ON storage.objects;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow Uploads for t2t-documents'
  ) THEN
    CREATE POLICY "Allow Uploads for t2t-documents"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 't2t-documents');
  END IF;
END $$;
