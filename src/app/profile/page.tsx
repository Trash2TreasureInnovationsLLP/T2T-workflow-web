import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { ProfileClient } from "./ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    include: {
      department: true,
      reportingManager: {
        select: { id: true, fullName: true, designation: true, email: true },
      },
      assignedTasks: {
        select: {
          id: true,
          taskId: true,
          title: true,
          priority: true,
          status: true,
          storyPoints: true,
          dueDate: true,
          completedAt: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const serializedUser = {
    id: user.id,
    email: user.email,
    employeeId: user.employeeId,
    fullName: user.fullName,
    role: user.role,
    designation: user.designation,
    skills: user.skills || "",
    avatarUrl: user.avatarUrl,
    accountStatus: user.accountStatus,
    joiningDate: user.joiningDate ? user.joiningDate.toISOString() : null,
    lastActive: user.lastActive ? user.lastActive.toISOString() : null,
    department: user.department
      ? {
          id: user.department.id,
          name: user.department.name,
          code: user.department.code,
        }
      : null,
    reportingManager: user.reportingManager,
    assignedTasks: user.assignedTasks.map((t) => ({
      id: t.id,
      taskId: t.taskId,
      title: t.title,
      priority: t.priority,
      status: t.status,
      storyPoints: t.storyPoints,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    })),
  };

  return (
    <AppShell user={currentUser}>
      <ProfileClient initialUser={serializedUser} currentUser={currentUser} />
    </AppShell>
  );
}
