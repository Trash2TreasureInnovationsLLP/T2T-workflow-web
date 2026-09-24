import { NextResponse } from "next/server";
import { prisma, syncDatabaseToCloud } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";
import { syncSprintToSupabase } from "@/lib/supabaseDbSync";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sprint = await prisma.sprint.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        tasks: {
          include: {
            assignee: {
              select: { id: true, fullName: true, avatarUrl: true },
            },
          },
        },
      },
    });

    if (!sprint) return NextResponse.json({ error: "Sprint not found" }, { status: 404 });

    return NextResponse.json(sprint);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sprint" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageSprints) {
      return NextResponse.json({ error: "Unauthorized to update sprint." }, { status: 403 });
    }

    const body = await req.json();
    const existing = await prisma.sprint.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Sprint not found" }, { status: 404 });

    const updated = await prisma.sprint.update({
      where: { id: params.id },
      data: {
        status: body.status ?? existing.status,
        reviewNotes: body.reviewNotes !== undefined ? body.reviewNotes : existing.reviewNotes,
        retroNotes: body.retroNotes !== undefined ? body.retroNotes : existing.retroNotes,
        goal: body.goal ?? existing.goal,
      },
      include: { project: true },
    });

    await logActivity({
      userId: user.id,
      action: "STATUS_CHANGE",
      objectType: "SPRINT",
      objectId: updated.id,
      objectTitle: updated.name,
      previousValue: existing.status,
      newValue: updated.status,
      details: `Sprint updated by ${user.fullName}`,
    });

    await syncSprintToSupabase(updated);
    await syncDatabaseToCloud();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Sprint PATCH error:", error);
    return NextResponse.json({ error: "Failed to update sprint" }, { status: 500 });
  }
}
