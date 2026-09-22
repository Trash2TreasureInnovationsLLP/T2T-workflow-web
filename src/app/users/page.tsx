import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { UsersClient } from "./UsersClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const permissions = getRolePermissions(user.role);
  if (!permissions.canManageUsers) {
    redirect("/unauthorized");
  }

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        department: true,
        reportingManager: { select: { id: true, fullName: true } },
        _count: {
          select: { assignedTasks: true, projectMemberships: true },
        },
      },
    }),
    prisma.department.findMany({ select: { id: true, name: true, code: true } }),
  ]);

  return (
    <AppShell user={user}>
      <UsersClient initialUsers={users} departments={departments} currentUser={user} />
    </AppShell>
  );
}
