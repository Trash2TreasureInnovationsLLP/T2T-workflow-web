import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        manager: {
          select: { id: true, fullName: true, avatarUrl: true, designation: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, avatarUrl: true, role: true },
            },
          },
        },
        _count: {
          select: { tasks: true, milestones: true, sprints: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageProjects) {
      return NextResponse.json(
        { error: "You do not have permission to create projects." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      name,
      description,
      managerId,
      startDate,
      targetDate,
      priority = "HIGH",
      status = "PLANNING",
      budget = 0,
      risks = "",
      blockers = "",
      memberIds = [],
    } = body;

    if (!name || !managerId || !startDate || !targetDate) {
      return NextResponse.json(
        { error: "Project name, manager, start date, and target date are required." },
        { status: 400 }
      );
    }

    // Generate Project ID e.g. T2T-PRJ-05
    const count = await prisma.project.count();
    const projectId = `T2T-PRJ-${String(count + 1).padStart(2, "0")}`;

    const newProject = await prisma.project.create({
      data: {
        projectId,
        name: name.trim(),
        description: description?.trim() || "",
        managerId,
        startDate: new Date(startDate),
        targetDate: new Date(targetDate),
        priority,
        status,
        budget: Number(budget) || 0,
        risks: risks?.trim() || "",
        blockers: blockers?.trim() || "",
        progress: 0,
        members: {
          create: Array.from(new Set([managerId, ...memberIds])).map((uId: any) => ({
            userId: uId,
            roleInProject: uId === managerId ? "Project Lead" : "Contributor",
          })),
        },
      },
      include: {
        manager: true,
        members: { include: { user: true } },
      },
    });

    await logActivity({
      userId: user.id,
      action: "CREATED",
      objectType: "PROJECT",
      objectId: newProject.id,
      objectTitle: `${newProject.projectId}: ${newProject.name}`,
      newValue: `Status: ${status}, Priority: ${priority}`,
      details: `Created by ${user.fullName}`,
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json({ error: "Failed to create project." }, { status: 500 });
  }
}
