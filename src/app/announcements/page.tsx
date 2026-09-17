import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AnnouncementsClient } from "./AnnouncementsClient";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [announcements, departments] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: { select: { id: true, fullName: true, role: true, avatarUrl: true } },
        targetDepartment: { select: { id: true, name: true } },
      },
    }),
    prisma.department.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <AppShell user={user}>
      <AnnouncementsClient
        initialAnnouncements={announcements}
        departments={departments}
        currentUser={user}
      />
    </AppShell>
  );
}
