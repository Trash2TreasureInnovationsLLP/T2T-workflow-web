import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma, syncDatabaseFromCloud } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { MyWorkClient } from "./MyWorkClient";

export const dynamic = "force-dynamic";

export default async function MyWorkPage() {
  await syncDatabaseFromCloud();

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const now = new Date();

  // Fetch all tasks assigned to the current user
  const myTasks = await prisma.task.findMany({
    where: { assigneeId: user.id },
    orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
    include: {
      project: { select: { id: true, name: true, projectId: true } },
      sprint: { select: { id: true, name: true, status: true } },
      comments: {
        include: {
          author: { select: { fullName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  // User's project memberships
  const myProjects = await prisma.projectMember.findMany({
    where: { userId: user.id },
    include: {
      project: {
        include: {
          manager: { select: { fullName: true } },
        },
      },
    },
  });

  // Recent user activity
  const myRecentActivity = await prisma.activityLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Unread user notifications
  const myNotifications = await prisma.notification.findMany({
    where: { userId: user.id, read: false },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <AppShell user={user}>
      <MyWorkClient
        user={user}
        tasks={myTasks}
        projects={myProjects.map((pm) => pm.project)}
        activity={myRecentActivity}
        notifications={myNotifications}
      />
    </AppShell>
  );
}
