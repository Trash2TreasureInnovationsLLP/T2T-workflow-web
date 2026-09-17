import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
                avatarUrl: true,
                role: true,
                designation: true,
              },
            },
          },
        },
        milestones: {
          orderBy: { dueDate: "asc" },
        },
        sprints: {
          orderBy: { startDate: "desc" },
        },
        tasks: {
          orderBy: { dueDate: "asc" },
          include: {
            assignee: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
        documents: {
          include: {
            uploadedBy: {
              select: { id: true, fullName: true },
            },
          },
        },
      },
    });

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageProjects) {
      return NextResponse.json({ error: "Unauthorized to update projects." }, { status: 403 });
    }

    const body = await req.json();
    const existing = await prisma.project.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const updated = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        status: body.status,
        priority: body.priority,
        progress: Number(body.progress) ?? existing.progress,
        budget: Number(body.budget) ?? existing.budget,
        risks: body.risks,
        blockers: body.blockers,
        startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
        targetDate: body.targetDate ? new Date(body.targetDate) : existing.targetDate,
      },
      include: {
        manager: true,
        members: { include: { user: true } },
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATED",
      objectType: "PROJECT",
      objectId: updated.id,
      objectTitle: `${updated.projectId}: ${updated.name}`,
      previousValue: existing.status,
      newValue: updated.status,
      details: `Updated by ${user.fullName}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Project PUT error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageProjects) {
      return NextResponse.json({ error: "Unauthorized to delete projects." }, { status: 403 });
    }

    const project = await prisma.project.findUnique({ where: { id: params.id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    await prisma.project.delete({ where: { id: params.id } });

    await logActivity({
      userId: user.id,
      action: "DELETED",
      objectType: "PROJECT",
      objectId: params.id,
      objectTitle: `${project.projectId}: ${project.name}`,
      details: `Deleted by ${user.fullName}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
