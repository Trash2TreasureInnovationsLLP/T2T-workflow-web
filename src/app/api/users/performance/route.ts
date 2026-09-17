import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const role = searchParams.get("role");

    const where: any = { accountStatus: "ACTIVE" };
    if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;
    if (role && role !== "ALL") where.role = role;

    const users = await prisma.user.findMany({
      where,
      include: {
        department: true,
        assignedTasks: {
          include: {
            sprint: true,
            project: true,
          },
        },
        projectMemberships: {
          include: {
            project: true,
          },
        },
      },
    });

    const now = new Date();

    const performanceData = users.map((u) => {
      const totalTasks = u.assignedTasks.length;
      const completedTasks = u.assignedTasks.filter((t) => t.status === "COMPLETED");
      const inProgressTasks = u.assignedTasks.filter(
        (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
      );
      const blockedTasks = u.assignedTasks.filter((t) => t.status === "BLOCKED");
      const overdueTasks = u.assignedTasks.filter(
        (t) => t.status !== "COMPLETED" && t.dueDate && new Date(t.dueDate) < now
      );

      // On-time completion: completed tasks where completedAt <= dueDate (or dueDate null)
      const onTimeCompleted = completedTasks.filter((t) => {
        if (!t.dueDate || !t.completedAt) return true;
        return new Date(t.completedAt) <= new Date(t.dueDate);
      }).length;

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 100;
      const onTimeRate =
        completedTasks.length > 0
          ? Math.round((onTimeCompleted / completedTasks.length) * 100)
          : 100;

      const storyPointsCompleted = completedTasks.reduce(
        (sum, t) => sum + (t.storyPoints || 1),
        0
      );
      const activeWorkloadPoints = inProgressTasks.reduce(
        (sum, t) => sum + (t.storyPoints || 1),
        0
      );

      const activeProjectsCount = u.projectMemberships.filter(
        (pm) => pm.project.status === "ACTIVE"
      ).length;

      // Workload health status: BALANCED, ELEVATED, CAPACITY_WARNING
      let workloadStatus = "BALANCED";
      if (inProgressTasks.length >= 5 || activeWorkloadPoints >= 15) {
        workloadStatus = "CAPACITY_WARNING";
      } else if (inProgressTasks.length >= 3 || activeWorkloadPoints >= 8) {
        workloadStatus = "ELEVATED";
      }

      return {
        id: u.id,
        fullName: u.fullName,
        employeeId: u.employeeId,
        avatarUrl: u.avatarUrl,
        role: u.role,
        department: u.department?.name || "General",
        designation: u.designation,
        totalTasks,
        completedCount: completedTasks.length,
        inProgressCount: inProgressTasks.length,
        blockedCount: blockedTasks.length,
        overdueCount: overdueTasks.length,
        completionRate,
        onTimeRate,
        storyPointsCompleted,
        activeWorkloadPoints,
        activeProjectsCount,
        workloadStatus,
      };
    });

    return NextResponse.json(performanceData);
  } catch (error) {
    console.error("Performance API error:", error);
    return NextResponse.json({ error: "Failed to calculate performance." }, { status: 500 });
  }
}
