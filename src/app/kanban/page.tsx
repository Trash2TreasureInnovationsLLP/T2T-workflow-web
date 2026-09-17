import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { KanbanClient } from "./KanbanClient";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [tasks, projects, sprints, users] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true, projectId: true } },
        sprint: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true, projectId: true } }),
    prisma.sprint.findMany({ select: { id: true, name: true, status: true } }),
    prisma.user.findMany({
      where: { accountStatus: "ACTIVE" },
      select: { id: true, fullName: true, avatarUrl: true },
    }),
  ]);

  return (
    <AppShell user={user}>
      <KanbanClient
        initialTasks={tasks}
        projects={projects}
        sprints={sprints}
        users={users}
        currentUser={user}
      />
    </AppShell>
  );
}
