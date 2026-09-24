import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, syncDatabaseToCloud, syncDatabaseFromCloud } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";
import { syncUserToSupabase, deleteUserFromSupabase } from "@/lib/supabaseDbSync";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await syncDatabaseFromCloud();

    let targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        department: true,
        reportingManager: { select: { id: true, fullName: true, designation: true } },
        subordinates: { select: { id: true, fullName: true, designation: true, role: true } },
        projectMemberships: {
          include: {
            project: { select: { id: true, projectId: true, name: true, status: true, progress: true } },
          },
        },
        assignedTasks: {
          orderBy: { dueDate: "asc" },
          include: {
            project: { select: { id: true, name: true, projectId: true } },
            sprint: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Compute user metrics
    const totalTasks = targetUser.assignedTasks.length;
    const completedTasks = targetUser.assignedTasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressTasks = targetUser.assignedTasks.filter(
      (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
    ).length;
    const blockedTasks = targetUser.assignedTasks.filter((t) => t.status === "BLOCKED").length;
    const overdueTasks = targetUser.assignedTasks.filter(
      (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return NextResponse.json({
      user: targetUser,
      metrics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        blockedTasks,
        overdueTasks,
        completionRate,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}

// PUT / PATCH: edit user, toggle status, or reset password
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageUsers) {
      return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    await syncDatabaseFromCloud();

    const body = await req.json();
    let existing = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existing) {
      existing = await prisma.user.findFirst({
        where: {
          OR: [
            { employeeId: params.id },
            { email: params.id.toLowerCase() },
          ],
        },
      });
    }
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: any = {};

    if (body.accountStatus) {
      updateData.accountStatus = body.accountStatus;
    }
    if (body.role) {
      updateData.role = body.role;
    }
    if (body.newDepartmentName && body.newDepartmentName.trim()) {
      const dName = body.newDepartmentName.trim();
      let dept = await prisma.department.findFirst({ where: { name: dName } });
      if (!dept) {
        const dCode = (dName.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "DEPT") + Math.floor(10 + Math.random() * 90);
        try {
          dept = await prisma.department.create({
            data: { name: dName, code: dCode, description: `${dName} Division` },
          });
        } catch (e) {
          dept = await prisma.department.findFirst({ where: { name: dName } });
        }
      }
      updateData.departmentId = dept ? dept.id : null;
    } else if (body.departmentId !== undefined) {
      if (body.departmentId && body.departmentId !== "__NEW__") {
        let dept = await prisma.department.findUnique({ where: { id: body.departmentId } });
        if (!dept) {
          dept = await prisma.department.findFirst({
            where: { OR: [{ name: body.departmentId }, { code: body.departmentId }] },
          });
        }
        if (!dept && body.departmentId.trim()) {
          const dName = body.departmentId.trim();
          const dCode = (dName.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "DEPT") + Math.floor(10 + Math.random() * 90);
          try {
            dept = await prisma.department.create({
              data: { name: dName, code: dCode, description: `${dName} Division` },
            });
          } catch (e) {
            dept = await prisma.department.findFirst({ where: { name: dName } });
          }
        }
        updateData.departmentId = dept ? dept.id : null;
      } else {
        updateData.departmentId = null;
      }
    }
    if (body.employeeId !== undefined) {
      const trimmedEmpId = body.employeeId?.trim();
      if (!trimmedEmpId) {
        return NextResponse.json({ error: "Employee ID cannot be empty." }, { status: 400 });
      }
      const duplicateEmp = await prisma.user.findFirst({
        where: {
          employeeId: trimmedEmpId,
          NOT: { id: params.id },
        },
      });
      if (duplicateEmp) {
        return NextResponse.json(
          { error: `Employee ID "${trimmedEmpId}" is already assigned to ${duplicateEmp.fullName}.` },
          { status: 400 }
        );
      }
      updateData.employeeId = trimmedEmpId;
    }
    if (body.designation !== undefined) {
      updateData.designation = body.designation.trim();
    }
    if (body.fullName !== undefined) {
      const trimmed = body.fullName.trim();
      if (trimmed.length > 0) {
        updateData.fullName = trimmed;
      }
    }
    if (body.skills !== undefined) {
      updateData.skills = body.skills;
    }
    if (body.reportingManagerId !== undefined) {
      updateData.reportingManagerId = body.reportingManagerId || null;
    }
    if (body.resetPasswordTo) {
      updateData.passwordHash = await hashPassword(body.resetPasswordTo);
      updateData.mustChangePassword = true; // force change on next login
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        department: true,
        reportingManager: { select: { id: true, fullName: true } },
        _count: {
          select: {
            assignedTasks: true,
            projectMemberships: true,
          },
        },
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATED",
      objectType: "USER",
      objectId: updatedUser.id,
      objectTitle: `${updatedUser.fullName} (${updatedUser.employeeId})`,
      newValue: body.accountStatus || body.role || `Name: ${updatedUser.fullName}`,
      details: body.resetPasswordTo ? "Password was reset by Super Admin" : `User record updated: ${updatedUser.fullName}`,
    });

    revalidatePath("/users");
    revalidatePath("/api/users");

    await syncUserToSupabase(updatedUser);
    await syncDatabaseToCloud();

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("User PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}

export const PUT = PATCH;

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageUsers) {
      return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    await syncDatabaseFromCloud();

    let targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) {
      targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { employeeId: params.id },
            { email: params.id.toLowerCase() },
          ],
        },
      });
    }

    // If still not found locally in SQLite, force fresh pull from Supabase Postgres
    if (!targetUser) {
      await syncDatabaseFromCloud(true);
      targetUser =
        (await prisma.user.findUnique({ where: { id: params.id } })) ||
        (await prisma.user.findFirst({
          where: {
            OR: [
              { employeeId: params.id },
              { email: params.id.toLowerCase() },
            ],
          },
        }));
    }

    const resolvedId = targetUser?.id || params.id;

    if (user.id === resolvedId || user.employeeId === params.id) {
      return NextResponse.json({ error: "You cannot delete your own Super Admin account." }, { status: 400 });
    }

    if (targetUser) {
      // Clean up or reassign all foreign-key dependencies cleanly in an extended transaction
      await prisma.$transaction(
        async (tx) => {
          // 1. Subordinates: decouple reportingManager
          await tx.user.updateMany({
            where: { reportingManagerId: resolvedId },
            data: { reportingManagerId: null },
          });

          // 2. Project Manager: reassign to acting Super Admin
          await tx.project.updateMany({
            where: { managerId: resolvedId },
            data: { managerId: user.id },
          });

          // 3. Task Assignee: unassign tasks
          await tx.task.updateMany({
            where: { assigneeId: resolvedId },
            data: { assigneeId: null },
          });

          // 4. Task Creator: reassign to acting Super Admin
          await tx.task.updateMany({
            where: { createdById: resolvedId },
            data: { createdById: user.id },
          });

          // 5. Comments & Attachments
          await tx.taskComment.deleteMany({ where: { authorId: resolvedId } });
          await tx.taskAttachment.deleteMany({ where: { uploadedById: resolvedId } });

          // 6. Documents & Announcements
          await tx.document.deleteMany({ where: { uploadedById: resolvedId } });
          await tx.announcement.deleteMany({ where: { authorId: resolvedId } });

          // 7. Memberships, Notifications, Activity Logs
          await tx.projectMember.deleteMany({ where: { userId: resolvedId } });
          await tx.notification.deleteMany({ where: { userId: resolvedId } });
          await tx.activityLog.deleteMany({ where: { userId: resolvedId } });

          // 8. Delete user record
          await tx.user.delete({ where: { id: resolvedId } });
        },
        {
          maxWait: 10000,
          timeout: 30000,
        }
      );

      await logActivity({
        userId: user.id,
        action: "DELETED",
        objectType: "USER",
        objectId: resolvedId,
        objectTitle: `${targetUser.fullName} (${targetUser.employeeId})`,
        details: `User permanently deleted by ${user.fullName}`,
      });
    }

    // Always delete from Supabase PostgreSQL directly too
    await deleteUserFromSupabase(resolvedId);
    if (resolvedId !== params.id) {
      await deleteUserFromSupabase(params.id);
    }
    await syncDatabaseToCloud();

    revalidatePath("/users");
    revalidatePath("/api/users");

    return NextResponse.json({ success: true, deletedId: resolvedId });
  } catch (error: any) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete user." }, { status: 500 });
  }
}
