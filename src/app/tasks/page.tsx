import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { TasksClient } from "./TasksClient";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [tasks, projects, sprints, users] = await Promise.all([
    prisma.task.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true, employeeId: true } },
        createdBy: { select: { id: true, fullName: true } },
        project: { select: { id: true, name: true, projectId: true } },
        sprint: { select: { id: true, name: true } },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true, projectId: true } }),
    prisma.sprint.findMany({ select: { id: true, name: true } }),
    prisma.user.findMany({
      where: { accountStatus: "ACTIVE" },
      select: { id: true, fullName: true, designation: true },
    }),
  ]);

  return (
    <AppShell user={user}>
      <TasksClient
        initialTasks={tasks}
        projects={projects}
        sprints={sprints}
        users={users}
        currentUser={user}
      />
    </AppShell>
  );
}
