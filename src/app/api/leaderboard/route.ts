import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculateTaskPoints, getMemberTier, PRIORITY_POINTS } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const timeframe = searchParams.get("timeframe") || "all"; // all, month, week

    // Calculate timeframe boundaries
    const now = new Date();
    let timeframeStart: Date | null = null;
    if (timeframe === "month") {
      timeframeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      timeframeStart = new Date(now.setDate(diff));
      timeframeStart.setHours(0, 0, 0, 0);
    }

    const whereUser: any = {
      accountStatus: "ACTIVE",
    };

    if (departmentId && departmentId !== "ALL") {
      whereUser.departmentId = departmentId;
    }

    const users = await prisma.user.findMany({
      where: whereUser,
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        assignedTasks: {
          include: {
            project: {
              select: { id: true, name: true, projectId: true },
            },
          },
        },
      },
    });

    let totalTeamPoints = 0;
    let totalCompletedTasks = 0;

    const rankedMembers = users.map((u) => {
      // Completed tasks within timeframe
      const allCompleted = u.assignedTasks.filter((t) => t.status === "COMPLETED");
      const filteredCompleted = allCompleted.filter((t) => {
        if (!timeframeStart) return true;
        if (!t.completedAt) return true; // fallback
        return new Date(t.completedAt) >= timeframeStart;
      });

      // In-progress tasks for potential points
      const inProgressTasks = u.assignedTasks.filter(
        (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
      );

      let totalPoints = 0;
      let onTimeCount = 0;

      const priorityBreakdown = {
        urgent: { count: 0, points: 0 },
        high: { count: 0, points: 0 },
        medium: { count: 0, points: 0 },
        low: { count: 0, points: 0 },
      };

      const completedTaskList = filteredCompleted.map((t) => {
        const pointsInfo = calculateTaskPoints({
          id: t.id,
          taskId: t.taskId,
          title: t.title,
          priority: t.priority,
          status: t.status,
          storyPoints: t.storyPoints,
          dueDate: t.dueDate,
          completedAt: t.completedAt,
        });

        totalPoints += pointsInfo.totalPoints;
        if (pointsInfo.isOnTime) onTimeCount++;

        const prioKey = (t.priority || "MEDIUM").toLowerCase() as keyof typeof priorityBreakdown;
        if (priorityBreakdown[prioKey]) {
          priorityBreakdown[prioKey].count++;
          priorityBreakdown[prioKey].points += pointsInfo.totalPoints;
        }

        return {
          id: t.id,
          taskId: t.taskId,
          title: t.title,
          priority: t.priority,
          storyPoints: t.storyPoints,
          projectName: t.project?.name || "General",
          completedAt: t.completedAt,
          points: pointsInfo.totalPoints,
          basePoints: pointsInfo.basePoints,
          storyPointsBonus: pointsInfo.storyPointsBonus,
          onTimeBonus: pointsInfo.onTimeBonus,
          isOnTime: pointsInfo.isOnTime,
        };
      });

      // Sort member completed tasks by latest completed
      completedTaskList.sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      });

      // Potential points in progress
      const potentialPoints = inProgressTasks.reduce((sum, t) => {
        const prio = (t.priority || "MEDIUM").toUpperCase();
        return sum + (PRIORITY_POINTS[prio] || 35) + (t.storyPoints || 1) * 10;
      }, 0);

      const onTimeRate =
        filteredCompleted.length > 0
          ? Math.round((onTimeCount / filteredCompleted.length) * 100)
          : 100;

      const tier = getMemberTier(totalPoints);

      totalTeamPoints += totalPoints;
      totalCompletedTasks += filteredCompleted.length;

      return {
        id: u.id,
        fullName: u.fullName,
        employeeId: u.employeeId,
        avatarUrl: u.avatarUrl,
        role: u.role,
        department: u.department?.name || "General",
        departmentCode: u.department?.code || "T2T",
        designation: u.designation,
        totalPoints,
        potentialPoints,
        completedCount: filteredCompleted.length,
        inProgressCount: inProgressTasks.length,
        onTimeRate,
        priorityBreakdown,
        tier,
        completedTasks: completedTaskList,
      };
    });

    // Sort descending by totalPoints, tiebreak with completedCount, then onTimeRate
    rankedMembers.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (b.completedCount !== a.completedCount) {
        return b.completedCount - a.completedCount;
      }
      return b.onTimeRate - a.onTimeRate;
    });

    // Add rank index (1, 2, 3...)
    const rankedWithPositions = rankedMembers.map((member, idx) => ({
      ...member,
      rank: idx + 1,
    }));

    // Identify current user standing
    const currentUserStanding = rankedWithPositions.find((m) => m.id === currentUser.id) || null;

    return NextResponse.json({
      leaderboard: rankedWithPositions,
      currentUserStanding,
      summary: {
        totalTeamPoints,
        totalCompletedTasks,
        activeMembersCount: rankedWithPositions.length,
        topPerformer: rankedWithPositions[0] || null,
      },
      scoringRules: {
        priorityPoints: PRIORITY_POINTS,
        storyPointMultiplier: 10,
        onTimeBonus: 25,
      },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard data." }, { status: 500 });
  }
}
