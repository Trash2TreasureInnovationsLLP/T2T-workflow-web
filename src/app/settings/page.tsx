import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsClient } from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const permissions = getRolePermissions(user.role);
  if (!permissions.canManageRoles && !permissions.canManageUsers) {
    redirect("/unauthorized");
  }

  const departments = await prisma.department.findMany({
    include: {
      _count: { select: { users: true } },
    },
  });

  return (
    <AppShell user={user}>
      <SettingsClient departments={departments} currentUser={user} />
    </AppShell>
  );
}
