import { NextResponse } from "next/server";
import { prisma, syncDatabaseToCloud, syncDatabaseFromCloud } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";
import { syncSprintToSupabase } from "@/lib/supabaseDbSync";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await syncDatabaseFromCloud();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: any = {};
    if (projectId && projectId !== "ALL") where.projectId = projectId;
    if (status && status !== "ALL") where.status = status;

    const sprints = await prisma.sprint.findMany({
      where,
      orderBy: { startDate: "desc" },
      include: {
        project: {
          select: { id: true, name: true, projectId: true },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Compute metrics for each sprint
    const sprintsWithMetrics = sprints.map((sprint) => {
      const totalPoints = sprint.tasks.reduce((sum, t) => sum + (t.storyPoints || 1), 0);
      const completedPoints = sprint.tasks
        .filter((t) => t.status === "COMPLETED")
        .reduce((sum, t) => sum + (t.storyPoints || 1), 0);
      const blockedCount = sprint.tasks.filter((t) => t.status === "BLOCKED").length;
      const progress = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

      return {
        ...sprint,
        totalPoints,
        completedPoints,
        remainingPoints: Math.max(0, totalPoints - completedPoints),
        blockedCount,
        progress,
      };
    });

    return NextResponse.json(sprintsWithMetrics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sprints." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageSprints) {
      return NextResponse.json(
        { error: "You do not have permission to create sprints." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, goal, startDate, endDate, projectId, status = "PLANNED" } = body;

    if (!name || !goal || !startDate || !endDate || !projectId) {
      return NextResponse.json(
        { error: "Sprint name, goal, dates, and project are required." },
        { status: 400 }
      );
    }

    const newSprint = await prisma.sprint.create({
      data: {
        name: name.trim(),
        goal: goal.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId,
        status,
      },
      include: {
        project: true,
      },
    });

    await logActivity({
      userId: user.id,
      action: "CREATED",
      objectType: "SPRINT",
      objectId: newSprint.id,
      objectTitle: newSprint.name,
      newValue: status,
      details: `Created by ${user.fullName} for project ${newSprint.project.name}`,
    });

    await syncSprintToSupabase(newSprint);
    await syncDatabaseToCloud();

    return NextResponse.json(newSprint, { status: 201 });
  } catch (error) {
    console.error("Sprint POST error:", error);
    return NextResponse.json({ error: "Failed to create sprint." }, { status: 500 });
  }
}
