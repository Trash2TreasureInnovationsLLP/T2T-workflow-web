import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma, syncDatabaseFromCloud } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectsClient } from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await syncDatabaseFromCloud();

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: {
        manager: {
          select: { id: true, fullName: true, avatarUrl: true, designation: true },
        },
        members: {
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true, designation: true } },
          },
        },
        _count: {
          select: { tasks: true, milestones: true, sprints: true },
        },
      },
    }),
    prisma.user.findMany({
      where: { accountStatus: "ACTIVE" },
      select: { id: true, fullName: true, designation: true },
    }),
  ]);

  return (
    <AppShell user={user}>
      <ProjectsClient initialProjects={projects} users={users} currentUser={user} />
    </AppShell>
  );
}
