import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AgileClient } from "./AgileClient";

export const dynamic = "force-dynamic";

export default async function AgilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [sprints, backlogTasks, projects] = await Promise.all([
    prisma.sprint.findMany({
      orderBy: { startDate: "desc" },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        tasks: {
          include: {
            assignee: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
    }),
    prisma.task.findMany({
      where: { sprintId: null },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        project: { select: { id: true, name: true, projectId: true } },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true, projectId: true } }),
  ]);

  return (
    <AppShell user={user}>
      <AgileClient
        initialSprints={sprints}
        initialBacklogTasks={backlogTasks}
        projects={projects}
        currentUser={user}
      />
    </AppShell>
  );
}
