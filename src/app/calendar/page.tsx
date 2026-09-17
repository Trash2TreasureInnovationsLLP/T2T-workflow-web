import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { CalendarClient } from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  return (
    <AppShell user={user}>
      <CalendarClient currentUser={user} />
    </AppShell>
  );
}
