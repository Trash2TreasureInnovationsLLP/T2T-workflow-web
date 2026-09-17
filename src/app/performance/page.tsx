import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PerformanceClient } from "./PerformanceClient";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const permissions = getRolePermissions(user.role);
  if (!permissions.canViewExecutiveDashboard) {
    redirect("/unauthorized");
  }

  const departments = await prisma.department.findMany({ select: { id: true, name: true } });

  return (
    <AppShell user={user}>
      <PerformanceClient departments={departments} currentUser={user} />
    </AppShell>
  );
}
