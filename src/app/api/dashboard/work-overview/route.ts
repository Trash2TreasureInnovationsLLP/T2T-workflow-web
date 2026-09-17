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

    // --- PAST WORK ---
    const completedTasks = await prisma.task.findMany({
      where: { status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true, projectId: true } },
      },
    });

    const completedProjects = await prisma.project.findMany({
      where: { status: "COMPLETED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        manager: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const pastSprints = await prisma.sprint.findMany({
      where: { status: "COMPLETED" },
      orderBy: { endDate: "desc" },
      take: 5,
      include: {
        project: { select: { id: true, name: true } },
        tasks: {
          select: { id: true, status: true, storyPoints: true },
        },
      },
    });

    // --- CURRENT WORK ---
    const activeProjects = await prisma.project.findMany({
      where: { status: "ACTIVE" },
      orderBy: { priority: "asc" },
      include: {
        manager: { select: { id: true, fullName: true, avatarUrl: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, designation: true } },
          },
        },
        tasks: {
          select: { id: true, status: true, priority: true },
        },
      },
    });

    const inProgressTasks = await prisma.task.findMany({
      where: { status: { in: ["IN_PROGRESS", "IN_REVIEW", "BLOCKED"] } },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true, projectId: true } },
      },
    });

    const currentSprints = await prisma.sprint.findMany({
      where: { status: "ACTIVE" },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    });

    // --- FUTURE WORK ---
    const upcomingTasks = await prisma.task.findMany({
      where: { status: { in: ["BACKLOG", "TODO"] } },
      orderBy: { dueDate: "asc" },
      take: 12,
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true, projectId: true } },
      },
    });

    const upcomingProjects = await prisma.project.findMany({
      where: { status: "PLANNING" },
      include: {
        manager: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    const plannedSprints = await prisma.sprint.findMany({
      where: { status: "PLANNED" },
      orderBy: { startDate: "asc" },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    const upcomingMilestones = await prisma.milestone.findMany({
      where: { status: "PENDING", dueDate: { gte: now } },
      orderBy: { dueDate: "asc" },
      take: 8,
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      past: {
        completedTasks,
        completedProjects,
        pastSprints,
      },
      current: {
        activeProjects,
        inProgressTasks,
        currentSprints,
      },
      future: {
        upcomingTasks,
        upcomingProjects,
        plannedSprints,
        upcomingMilestones,
      },
    });
  } catch (error) {
    console.error("Work overview error:", error);
    return NextResponse.json({ error: "Failed to fetch work overview." }, { status: 500 });
  }
}
