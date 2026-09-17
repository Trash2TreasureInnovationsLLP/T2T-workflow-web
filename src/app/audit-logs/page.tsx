import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { AuditLogsClient } from "./AuditLogsClient";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const permissions = getRolePermissions(user.role);
  if (!permissions.canViewAuditLogs) {
    redirect("/unauthorized");
  }

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: { id: true, fullName: true, email: true, employeeId: true, role: true },
      },
    },
  });

  return (
    <AppShell user={user}>
      <AuditLogsClient initialLogs={logs} currentUser={user} />
    </AppShell>
  );
}
