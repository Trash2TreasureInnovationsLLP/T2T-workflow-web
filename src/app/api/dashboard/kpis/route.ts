import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // 1. Members
    const totalMembers = await prisma.user.count();
    const activeMembers = await prisma.user.count({ where: { accountStatus: "ACTIVE" } });

    // 2. Projects
    const totalProjects = await prisma.project.count();
    const activeProjects = await prisma.project.count({ where: { status: "ACTIVE" } });
    const completedProjects = await prisma.project.count({ where: { status: "COMPLETED" } });

    // 3. Tasks
    const totalTasks = await prisma.task.count();
    const inProgressTasks = await prisma.task.count({ where: { status: "IN_PROGRESS" } });
    const completedTasks = await prisma.task.count({ where: { status: "COMPLETED" } });
    const blockedTasks = await prisma.task.count({ where: { status: "BLOCKED" } });
    const overdueTasks = await prisma.task.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueDate: { lt: now },
      },
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const upcomingDeadlines = await prisma.task.count({
      where: {
        status: { notIn: ["COMPLETED", "CANCELLED"] },
        dueDate: { gte: now, lte: nextWeek },
      },
    });

    // 4. Current Active Sprint
    const activeSprint = await prisma.sprint.findFirst({
      where: { status: "ACTIVE" },
      include: {
        tasks: true,
      },
    });

    let currentSprintProgress = 0;
    let sprintStoryPoints = { total: 0, completed: 0, remaining: 0 };

    if (activeSprint) {
      const totalPoints = activeSprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
      const completedPoints = activeSprint.tasks
        .filter((t) => t.status === "COMPLETED")
        .reduce((sum, t) => sum + (t.storyPoints || 1), 0);
      sprintStoryPoints = {
        total: totalPoints,
        completed: completedPoints,
        remaining: Math.max(0, totalPoints - completedPoints),
      };
      currentSprintProgress =
        totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
    }

    // Health Score: based on completion rate, overdue tasks, and blockers
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100;
    const blockerPenalty = blockedTasks * 5;
    const overduePenalty = overdueTasks * 4;
    const healthScore = Math.max(
      15,
      Math.min(100, Math.round(taskCompletionRate - blockerPenalty - overduePenalty + 30))
    );

    return NextResponse.json({
      totalMembers,
      activeMembers,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      inProgressTasks,
      completedTasks,
      blockedTasks,
      overdueTasks,
      upcomingDeadlines,
      activeSprint: activeSprint
        ? {
            id: activeSprint.id,
            name: activeSprint.name,
            goal: activeSprint.goal,
            progress: currentSprintProgress,
            storyPoints: sprintStoryPoints,
          }
        : null,
      healthScore,
    });
  } catch (error) {
    console.error("Failed to load KPIs:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics." }, { status: 500 });
  }
}
