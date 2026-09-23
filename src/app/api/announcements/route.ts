import { NextResponse } from "next/server";
import { prisma, syncDatabaseToCloud, syncDatabaseFromCloud } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await syncDatabaseFromCloud();

    const announcements = await prisma.announcement.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      include: {
        author: {
          select: { id: true, fullName: true, role: true, avatarUrl: true },
        },
        targetDepartment: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch announcements" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canPostAnnouncements) {
      return NextResponse.json(
        { error: "Only leadership can post company announcements." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, priority = "MEDIUM", isPinned = false, targetDepartmentId } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Announcement title and message are required." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        priority,
        isPinned: Boolean(isPinned),
        targetDepartmentId: targetDepartmentId || null,
        authorId: user.id,
      },
      include: { author: true },
    });

    await logActivity({
      userId: user.id,
      action: "CREATED",
      objectType: "ANNOUNCEMENT",
      objectId: announcement.id,
      objectTitle: announcement.title,
      newValue: `Priority: ${priority}`,
      details: `Published by ${user.fullName}`,
    });

    await syncDatabaseToCloud();

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
