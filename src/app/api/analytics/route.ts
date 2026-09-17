import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canViewExecutiveDashboard) {
      return NextResponse.json({ error: "Unauthorized to view team analytics." }, { status: 403 });
    }

    // 1. Task Status Distribution
    const tasksByStatus = await prisma.task.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const statusDistribution = tasksByStatus.map((item) => ({
      name: item.status.replace("_", " "),
      count: item._count.id,
    }));

    // 2. Priority Distribution
    const tasksByPriority = await prisma.task.groupBy({
      by: ["priority"],
      _count: { id: true },
    });
    const priorityDistribution = tasksByPriority.map((item) => ({
      name: item.priority,
      count: item._count.id,
    }));

    // 3. Project Progress
    const projects = await prisma.project.findMany({
      select: {
        projectId: true,
        name: true,
        status: true,
        progress: true,
        priority: true,
        _count: { select: { tasks: true } },
      },
    });

    const projectProgressData = projects.map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + "..." : p.name,
      code: p.projectId,
      progress: p.progress,
      tasks: p._count.tasks,
    }));

    // 4. Sprint Velocity
    const sprints = await prisma.sprint.findMany({
      include: {
        tasks: {
          select: { status: true, storyPoints: true },
        },
      },
      orderBy: { startDate: "asc" },
      take: 6,
    });

    const sprintVelocityData = sprints.map((s) => {
      const plannedPoints = s.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
      const completedPoints = s.tasks
        .filter((t) => t.status === "COMPLETED")
        .reduce((sum, t) => sum + (t.storyPoints || 1), 0);

      return {
        name: s.name.split(":")[0] || s.name,
        planned: plannedPoints,
        completed: completedPoints,
        status: s.status,
      };
    });

    // 5. Workload Distribution by Member
    const activeMembers = await prisma.user.findMany({
      where: { accountStatus: "ACTIVE" },
      include: {
        assignedTasks: {
          select: { status: true, storyPoints: true },
        },
      },
    });

    const workloadData = activeMembers
      .map((m) => {
        const inProgress = m.assignedTasks.filter(
          (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
        ).length;
        const completed = m.assignedTasks.filter((t) => t.status === "COMPLETED").length;
        const totalPoints = m.assignedTasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
        return {
          name: m.fullName.split(" ")[0],
          inProgress,
          completed,
          totalPoints,
        };
      })
      .filter((m) => m.inProgress > 0 || m.completed > 0);

    // 6. Department Task Load
    const departments = await prisma.department.findMany({
      include: {
        users: {
          include: {
            assignedTasks: { select: { id: true, status: true } },
          },
        },
      },
    });

    const departmentActivity = departments.map((d) => {
      let taskCount = 0;
      let completedCount = 0;
      d.users.forEach((u) => {
        taskCount += u.assignedTasks.length;
        completedCount += u.assignedTasks.filter((t) => t.status === "COMPLETED").length;
      });
      return {
        name: d.code,
        fullName: d.name,
        totalTasks: taskCount,
        completedTasks: completedCount,
      };
    });

    return NextResponse.json({
      statusDistribution,
      priorityDistribution,
      projectProgressData,
      sprintVelocityData,
      workloadData,
      departmentActivity,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to generate analytics." }, { status: 500 });
  }
}
