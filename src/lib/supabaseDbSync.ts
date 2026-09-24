import { supabaseAdmin } from "./supabase";
import { prisma } from "./prisma";

function formatDates(record: any) {
  if (!record) return record;
  const formatted = { ...record };
  for (const [k, v] of Object.entries(formatted)) {
    if (v instanceof Date) {
      formatted[k] = v.toISOString();
    }
  }
  return formatted;
}

export async function syncUserToSupabase(user: any): Promise<void> {
  try {
    const payload = formatDates({
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      fullName: user.fullName,
      passwordHash: user.passwordHash,
      mustChangePassword: user.mustChangePassword ?? false,
      role: user.role,
      departmentId: user.departmentId || null,
      designation: user.designation,
      accountStatus: user.accountStatus || "ACTIVE",
      joiningDate: user.joiningDate,
      reportingManagerId: user.reportingManagerId || null,
      skills: user.skills || "",
      avatarUrl: user.avatarUrl || null,
      lastActive: user.lastActive || new Date(),
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    });

    const { error } = await supabaseAdmin.from("User").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[SupabasePostgres] Failed to sync user:", error.message);
    } else {
      console.log(`[SupabasePostgres] Synced user ${user.fullName} (${user.employeeId})`);
    }
  } catch (err) {
    console.error("[SupabasePostgres] syncUserToSupabase error:", err);
  }
}

export async function deleteUserFromSupabase(userId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("User").delete().eq("id", userId);
    if (error) {
      console.error("[SupabasePostgres] Failed to delete user:", error.message);
    } else {
      console.log(`[SupabasePostgres] Deleted user ${userId}`);
    }
  } catch (err) {
    console.error("[SupabasePostgres] deleteUserFromSupabase error:", err);
  }
}

export async function syncDepartmentToSupabase(dept: any): Promise<void> {
  try {
    const payload = formatDates({
      id: dept.id,
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
      createdAt: dept.createdAt || new Date(),
    });

    const { error } = await supabaseAdmin.from("Department").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[SupabasePostgres] Failed to sync department:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] syncDepartmentToSupabase error:", err);
  }
}

export async function syncProjectToSupabase(project: any): Promise<void> {
  try {
    const payload = formatDates({
      id: project.id,
      projectId: project.projectId,
      name: project.name,
      description: project.description || "",
      managerId: project.managerId,
      startDate: project.startDate,
      targetDate: project.targetDate,
      priority: project.priority || "MEDIUM",
      status: project.status || "PLANNING",
      budget: project.budget || 0,
      risks: project.risks || "",
      blockers: project.blockers || "",
      progress: project.progress || 0,
      createdAt: project.createdAt || new Date(),
      updatedAt: project.updatedAt || new Date(),
    });

    const { error } = await supabaseAdmin.from("Project").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[SupabasePostgres] Failed to sync project:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] syncProjectToSupabase error:", err);
  }
}

export async function deleteProjectFromSupabase(projectId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("Project").delete().eq("id", projectId);
    if (error) {
      console.error("[SupabasePostgres] Failed to delete project:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] deleteProjectFromSupabase error:", err);
  }
}

export async function syncTaskToSupabase(task: any): Promise<void> {
  try {
    const payload = formatDates({
      id: task.id,
      taskId: task.taskId,
      title: task.title,
      description: task.description || "",
      projectId: task.projectId,
      sprintId: task.sprintId || null,
      assigneeId: task.assigneeId || null,
      createdById: task.createdById,
      priority: task.priority || "MEDIUM",
      status: task.status || "TODO",
      dueDate: task.dueDate || null,
      estimatedEffort: task.estimatedEffort || 0,
      actualEffort: task.actualEffort || 0,
      storyPoints: task.storyPoints || 1,
      tags: task.tags || "",
      blockers: task.blockers || null,
      completedAt: task.completedAt || null,
      createdAt: task.createdAt || new Date(),
      updatedAt: task.updatedAt || new Date(),
    });

    const { error } = await supabaseAdmin.from("Task").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[SupabasePostgres] Failed to sync task:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] syncTaskToSupabase error:", err);
  }
}

export async function deleteTaskFromSupabase(taskId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("Task").delete().eq("id", taskId);
    if (error) {
      console.error("[SupabasePostgres] Failed to delete task:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] deleteTaskFromSupabase error:", err);
  }
}

export async function syncSprintToSupabase(sprint: any): Promise<void> {
  try {
    const payload = formatDates({
      id: sprint.id,
      name: sprint.name,
      goal: sprint.goal || "",
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      projectId: sprint.projectId,
      status: sprint.status || "PLANNED",
      reviewNotes: sprint.reviewNotes || null,
      retroNotes: sprint.retroNotes || null,
      createdAt: sprint.createdAt || new Date(),
      updatedAt: sprint.updatedAt || new Date(),
    });

    const { error } = await supabaseAdmin.from("Sprint").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[SupabasePostgres] Failed to sync sprint:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] syncSprintToSupabase error:", err);
  }
}

export async function syncDocumentToSupabase(doc: any): Promise<void> {
  try {
    const payload = formatDates({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      fileType: doc.fileType,
      category: doc.category,
      projectId: doc.projectId || null,
      uploadedById: doc.uploadedById,
      createdAt: doc.createdAt || new Date(),
      updatedAt: doc.updatedAt || new Date(),
    });

    const { error } = await supabaseAdmin.from("Document").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[SupabasePostgres] Failed to sync document:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] syncDocumentToSupabase error:", err);
  }
}

export async function syncAnnouncementToSupabase(announcement: any): Promise<void> {
  try {
    const payload = formatDates({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      isPinned: announcement.isPinned,
      targetDepartmentId: announcement.targetDepartmentId || null,
      authorId: announcement.authorId,
      createdAt: announcement.createdAt || new Date(),
    });

    const { error } = await supabaseAdmin.from("Announcement").upsert(payload, { onConflict: "id" });
    if (error) {
      console.error("[SupabasePostgres] Failed to sync announcement:", error.message);
    }
  } catch (err) {
    console.error("[SupabasePostgres] syncAnnouncementToSupabase error:", err);
  }
}

export async function syncAllToSupabasePostgres(): Promise<void> {
  try {
    const [depts, users, projects, sprints, tasks, docs, announcements] = await Promise.all([
      prisma.department.findMany(),
      prisma.user.findMany(),
      prisma.project.findMany(),
      prisma.sprint.findMany(),
      prisma.task.findMany(),
      prisma.document.findMany(),
      prisma.announcement.findMany(),
    ]);

    if (depts.length > 0) {
      await supabaseAdmin.from("Department").upsert(depts.map(formatDates), { onConflict: "id" });
    }
    if (users.length > 0) {
      await supabaseAdmin.from("User").upsert(users.map(formatDates), { onConflict: "id" });
    }
    if (projects.length > 0) {
      await supabaseAdmin.from("Project").upsert(projects.map(formatDates), { onConflict: "id" });
    }
    if (sprints.length > 0) {
      await supabaseAdmin.from("Sprint").upsert(sprints.map(formatDates), { onConflict: "id" });
    }
    if (tasks.length > 0) {
      await supabaseAdmin.from("Task").upsert(tasks.map(formatDates), { onConflict: "id" });
    }
    if (docs.length > 0) {
      await supabaseAdmin.from("Document").upsert(docs.map(formatDates), { onConflict: "id" });
    }
    if (announcements.length > 0) {
      await supabaseAdmin.from("Announcement").upsert(announcements.map(formatDates), { onConflict: "id" });
    }

    console.log("[SupabasePostgres] Full sync complete");
  } catch (err) {
    console.error("[SupabasePostgres] syncAllToSupabasePostgres error:", err);
  }
}
