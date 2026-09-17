import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsClient } from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const permissions = getRolePermissions(user.role);
  if (!permissions.canViewExecutiveDashboard) {
    redirect("/unauthorized");
  }

  return (
    <AppShell user={user}>
      <AnalyticsClient currentUser={user} />
    </AppShell>
  );
}
