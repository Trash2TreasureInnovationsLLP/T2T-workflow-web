import { NextResponse } from "next/server";
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
    if (body.departmentId !== undefined) {
      updateData.departmentId = body.departmentId || null;
    }
    if (body.designation) {
      updateData.designation = body.designation;
    }
    if (body.fullName) {
      updateData.fullName = body.fullName;
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
      include: { department: true },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATED",
      objectType: "USER",
      objectId: updatedUser.id,
      objectTitle: `${updatedUser.fullName} (${updatedUser.employeeId})`,
      newValue: body.accountStatus || body.role || "Profile updated",
      details: body.resetPasswordTo ? "Password was reset by Super Admin" : "User record updated",
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("User PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user." }, { status: 500 });
  }
}
