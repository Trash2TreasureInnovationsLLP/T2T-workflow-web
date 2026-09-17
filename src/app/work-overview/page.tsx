import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { WorkOverviewClient } from "./WorkOverviewClient";

export const dynamic = "force-dynamic";

export default async function WorkOverviewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const now = new Date();

  // 1. Past Work
  const completedTasks = await prisma.task.findMany({
    where: { status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    include: {
      assignee: true,
      project: true,
    },
  });

  const completedProjects = await prisma.project.findMany({
    where: { status: "COMPLETED" },
    orderBy: { updatedAt: "desc" },
    include: {
      manager: true,
      _count: { select: { tasks: true } },
    },
  });

  const pastSprints = await prisma.sprint.findMany({
    where: { status: "COMPLETED" },
    orderBy: { endDate: "desc" },
    include: {
      project: true,
      tasks: { select: { storyPoints: true, status: true } },
    },
  });

  // 2. Current Work
  const activeProjects = await prisma.project.findMany({
    where: { status: "ACTIVE" },
    include: {
      manager: true,
      members: { include: { user: true } },
      tasks: { select: { id: true, status: true } },
    },
  });

  const inProgressTasks = await prisma.task.findMany({
    where: { status: { in: ["IN_PROGRESS", "IN_REVIEW", "BLOCKED"] } },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    include: {
      assignee: true,
      project: true,
      sprint: true,
    },
  });

  const currentSprints = await prisma.sprint.findMany({
    where: { status: "ACTIVE" },
    include: {
      project: true,
      tasks: {
        include: { assignee: true },
      },
    },
  });

  // 3. Future Work
  const upcomingTasks = await prisma.task.findMany({
    where: { status: { in: ["BACKLOG", "TODO"] } },
    orderBy: { dueDate: "asc" },
    include: {
      assignee: true,
      project: true,
    },
  });

  const upcomingProjects = await prisma.project.findMany({
    where: { status: "PLANNING" },
    include: {
      manager: true,
    },
  });

  const plannedSprints = await prisma.sprint.findMany({
    where: { status: "PLANNED" },
    orderBy: { startDate: "asc" },
    include: {
      project: true,
      tasks: true,
    },
  });

  const upcomingMilestones = await prisma.milestone.findMany({
    where: { status: "PENDING", dueDate: { gte: now } },
    orderBy: { dueDate: "asc" },
    include: {
      project: true,
    },
  });

  return (
    <AppShell user={user}>
      <WorkOverviewClient
        past={{
          completedTasks,
          completedProjects,
          pastSprints,
        }}
        current={{
          activeProjects,
          inProgressTasks,
          currentSprints,
        }}
        future={{
          upcomingTasks,
          upcomingProjects,
          plannedSprints,
          upcomingMilestones,
        }}
      />
    </AppShell>
  );
}
