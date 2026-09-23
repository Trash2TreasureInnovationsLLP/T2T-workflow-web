import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const targetUser = await prisma.user.findUnique({
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

    const body = await req.json();
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
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

    const targetUser = await prisma.user.findUnique({ where: { id: params.id } });
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.id === params.id) {
      return NextResponse.json({ error: "You cannot delete your own Super Admin account." }, { status: 400 });
    }

    // Clean up or reassign all foreign-key dependencies cleanly in an extended transaction
    await prisma.$transaction(
      async (tx) => {
        // 1. Subordinates: decouple reportingManager
        await tx.user.updateMany({
          where: { reportingManagerId: params.id },
          data: { reportingManagerId: null },
        });

        // 2. Project Manager: reassign to acting Super Admin
        await tx.project.updateMany({
          where: { managerId: params.id },
          data: { managerId: user.id },
        });

        // 3. Task Assignee: unassign tasks
        await tx.task.updateMany({
          where: { assigneeId: params.id },
          data: { assigneeId: null },
        });

        // 4. Task Creator: reassign to acting Super Admin
        await tx.task.updateMany({
          where: { createdById: params.id },
          data: { createdById: user.id },
        });

        // 5. Comments & Attachments
        await tx.taskComment.deleteMany({ where: { authorId: params.id } });
        await tx.taskAttachment.deleteMany({ where: { uploadedById: params.id } });

        // 6. Documents & Announcements
        await tx.document.deleteMany({ where: { uploadedById: params.id } });
        await tx.announcement.deleteMany({ where: { authorId: params.id } });

        // 7. Memberships, Notifications, Activity Logs
        await tx.projectMember.deleteMany({ where: { userId: params.id } });
        await tx.notification.deleteMany({ where: { userId: params.id } });
        await tx.activityLog.deleteMany({ where: { userId: params.id } });

        // 8. Delete user record
        await tx.user.delete({ where: { id: params.id } });
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
      objectId: params.id,
      objectTitle: `${targetUser.fullName} (${targetUser.employeeId})`,
      details: `User permanently deleted by ${user.fullName}`,
    });

    revalidatePath("/users");
    revalidatePath("/api/users");

    return NextResponse.json({ success: true, deletedId: params.id });
  } catch (error: any) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete user." }, { status: 500 });
  }
}
