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

export async function pullFromSupabasePostgres(): Promise<void> {
  try {
    const { data: pgUsers, error: uErr } = await supabaseAdmin.from("User").select("*");
    if (uErr || !pgUsers || pgUsers.length === 0) return;

    const { data: pgDepts } = await supabaseAdmin.from("Department").select("*");
    const { data: pgProjects } = await supabaseAdmin.from("Project").select("*");
    const { data: pgSprints } = await supabaseAdmin.from("Sprint").select("*");
    const { data: pgTasks } = await supabaseAdmin.from("Task").select("*");
    const { data: pgDocs } = await supabaseAdmin.from("Document").select("*");
    const { data: pgAnnouncements } = await supabaseAdmin.from("Announcement").select("*");

    // 1. Sync Departments
    if (pgDepts) {
      for (const d of pgDepts) {
        await prisma.department.upsert({
          where: { id: d.id },
          create: {
            id: d.id,
            name: d.name,
            code: d.code,
            description: d.description || "",
            createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
          },
          update: {
            name: d.name,
            code: d.code,
            description: d.description || "",
          },
        }).catch(() => {});
      }
    }

    // 2. Sync Users
    const pgUserIds = new Set(pgUsers.map((u) => u.id));
    for (const u of pgUsers) {
      await prisma.user.upsert({
        where: { id: u.id },
        create: {
          id: u.id,
          email: u.email,
          employeeId: u.employeeId,
          fullName: u.fullName,
          passwordHash: u.passwordHash,
          mustChangePassword: u.mustChangePassword ?? false,
          role: u.role,
          departmentId: u.departmentId || null,
          designation: u.designation,
          accountStatus: u.accountStatus || "ACTIVE",
          joiningDate: u.joiningDate ? new Date(u.joiningDate) : new Date(),
          reportingManagerId: u.reportingManagerId || null,
          skills: u.skills || "",
          avatarUrl: u.avatarUrl || null,
          lastActive: u.lastActive ? new Date(u.lastActive) : new Date(),
          createdAt: u.createdAt ? new Date(u.createdAt) : new Date(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt) : new Date(),
        },
        update: {
          email: u.email,
          employeeId: u.employeeId,
          fullName: u.fullName,
          role: u.role,
          departmentId: u.departmentId || null,
          designation: u.designation,
          accountStatus: u.accountStatus || "ACTIVE",
          skills: u.skills || "",
          avatarUrl: u.avatarUrl || null,
          mustChangePassword: u.mustChangePassword ?? false,
        },
      }).catch(() => {});
    }

    // Remove local users that are no longer in Supabase Postgres (e.g. deleted)
    const localUsers = await prisma.user.findMany({ select: { id: true } });
    for (const lu of localUsers) {
      if (!pgUserIds.has(lu.id)) {
        await prisma.user.delete({ where: { id: lu.id } }).catch(() => {});
      }
    }

    // 3. Sync Projects
    if (pgProjects) {
      for (const p of pgProjects) {
        await prisma.project.upsert({
          where: { id: p.id },
          create: {
            id: p.id,
            projectId: p.projectId,
            name: p.name,
            description: p.description || "",
            managerId: p.managerId,
            startDate: p.startDate ? new Date(p.startDate) : new Date(),
            targetDate: p.targetDate ? new Date(p.targetDate) : new Date(),
            priority: p.priority || "MEDIUM",
            status: p.status || "PLANNING",
            budget: Number(p.budget) || 0,
            risks: p.risks || "",
            blockers: p.blockers || "",
            progress: Number(p.progress) || 0,
            createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
            updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
          },
          update: {
            name: p.name,
            description: p.description || "",
            status: p.status || "PLANNING",
            priority: p.priority || "MEDIUM",
            progress: Number(p.progress) || 0,
            budget: Number(p.budget) || 0,
            risks: p.risks || "",
            blockers: p.blockers || "",
          },
        }).catch(() => {});
      }
    }

    // 4. Sync Sprints
    if (pgSprints) {
      for (const s of pgSprints) {
        await prisma.sprint.upsert({
          where: { id: s.id },
          create: {
            id: s.id,
            name: s.name,
            goal: s.goal || "",
            startDate: s.startDate ? new Date(s.startDate) : new Date(),
            endDate: s.endDate ? new Date(s.endDate) : new Date(),
            projectId: s.projectId,
            status: s.status || "PLANNED",
            reviewNotes: s.reviewNotes || null,
            retroNotes: s.retroNotes || null,
            createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
            updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
          },
          update: {
            name: s.name,
            goal: s.goal || "",
            status: s.status || "PLANNED",
            reviewNotes: s.reviewNotes || null,
            retroNotes: s.retroNotes || null,
          },
        }).catch(() => {});
      }
    }

    // 5. Sync Tasks
    if (pgTasks) {
      for (const t of pgTasks) {
        await prisma.task.upsert({
          where: { id: t.id },
          create: {
            id: t.id,
            taskId: t.taskId,
            title: t.title,
            description: t.description || "",
            projectId: t.projectId,
            sprintId: t.sprintId || null,
            assigneeId: t.assigneeId || null,
            createdById: t.createdById,
            priority: t.priority || "MEDIUM",
            status: t.status || "TODO",
            dueDate: t.dueDate ? new Date(t.dueDate) : null,
            estimatedEffort: Number(t.estimatedEffort) || 0,
            actualEffort: Number(t.actualEffort) || 0,
            storyPoints: Number(t.storyPoints) || 1,
            tags: t.tags || "",
            blockers: t.blockers || null,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
            createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
          },
          update: {
            title: t.title,
            description: t.description || "",
            status: t.status || "TODO",
            priority: t.priority || "MEDIUM",
            assigneeId: t.assigneeId || null,
            sprintId: t.sprintId || null,
            blockers: t.blockers || null,
            completedAt: t.completedAt ? new Date(t.completedAt) : null,
          },
        }).catch(() => {});
      }
    }

    // 6. Sync Documents
    if (pgDocs) {
      for (const doc of pgDocs) {
        await prisma.document.upsert({
          where: { id: doc.id },
          create: {
            id: doc.id,
            title: doc.title,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: Number(doc.fileSize) || 102400,
            fileType: doc.fileType,
            category: doc.category,
            projectId: doc.projectId || null,
            uploadedById: doc.uploadedById,
            createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(),
          },
          update: {
            title: doc.title,
            fileUrl: doc.fileUrl,
            category: doc.category,
          },
        }).catch(() => {});
      }
    }

    // 7. Sync Announcements
    if (pgAnnouncements) {
      for (const a of pgAnnouncements) {
        await prisma.announcement.upsert({
          where: { id: a.id },
          create: {
            id: a.id,
            title: a.title,
            content: a.content,
            priority: a.priority,
            isPinned: Boolean(a.isPinned),
            targetDepartmentId: a.targetDepartmentId || null,
            authorId: a.authorId,
            createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
          },
          update: {
            title: a.title,
            content: a.content,
            priority: a.priority,
            isPinned: Boolean(a.isPinned),
          },
        }).catch(() => {});
      }
    }

    console.log(`[SupabasePostgres] Pulled ${pgUsers.length} users and all records to local database`);
  } catch (err) {
    console.error("[SupabasePostgres] pullFromSupabasePostgres error:", err);
  }
}
