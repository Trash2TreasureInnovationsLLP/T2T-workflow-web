import React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentsClient } from "./DocumentsClient";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const [documents, projects] = await Promise.all([
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        uploadedBy: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    }),
    prisma.project.findMany({ select: { id: true, name: true, projectId: true } }),
  ]);

  return (
    <AppShell user={user}>
      <DocumentsClient initialDocuments={documents} projects={projects} currentUser={user} />
    </AppShell>
  );
}
