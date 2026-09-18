import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { LeaderboardClient } from "./LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const departments = await prisma.department.findMany({
    select: { id: true, name: true, code: true },
    orderBy: { name: "asc" },
  });

  return (
    <AppShell user={user}>
      <LeaderboardClient departments={departments} currentUser={user} />
    </AppShell>
  );
}
