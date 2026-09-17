import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/layout/AppShell";
import { PriorityBadge, StatusBadge, Badge } from "@/components/ui/Badge";
import {
  FolderKanban,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Zap,
  Users,
  ArrowLeft,
  DollarSign,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { ProjectDetailClient } from "./ProjectDetailClient";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      manager: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              employeeId: true,
              avatarUrl: true,
              designation: true,
              role: true,
            },
          },
        },
      },
      milestones: { orderBy: { dueDate: "asc" } },
      sprints: { orderBy: { startDate: "desc" } },
      tasks: {
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
        include: {
          assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        },
      },
      documents: {
        include: {
          uploadedBy: { select: { fullName: true } },
        },
      },
    },
  });

  if (!project) notFound();

  return (
    <AppShell user={user}>
      <ProjectDetailClient project={project} currentUser={user} />
    </AppShell>
  );
}
