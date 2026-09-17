import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q) {
      return NextResponse.json({
        tasks: [],
        projects: [],
        sprints: [],
        users: [],
        announcements: [],
      });
    }

    const [tasks, projects, sprints, users, announcements] = await Promise.all([
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { taskId: { contains: q } },
            { description: { contains: q } },
            { tags: { contains: q } },
          ],
        },
        take: 5,
        select: {
          id: true,
          taskId: true,
          title: true,
          description: true,
          status: true,
          priority: true,
        },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { projectId: { contains: q } },
            { description: { contains: q } },
          ],
        },
        take: 5,
        select: {
          id: true,
          projectId: true,
          name: true,
          description: true,
          status: true,
        },
      }),
      prisma.sprint.findMany({
        where: {
          OR: [{ name: { contains: q } }, { goal: { contains: q } }],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          goal: true,
          status: true,
        },
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: q } },
            { email: { contains: q } },
            { employeeId: { contains: q } },
            { designation: { contains: q } },
          ],
        },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          designation: true,
        },
      }),
      prisma.announcement.findMany({
        where: {
          OR: [{ title: { contains: q } }, { content: { contains: q } }],
        },
        take: 5,
        select: {
          id: true,
          title: true,
          priority: true,
        },
      }),
    ]);

    return NextResponse.json({
      tasks,
      projects,
      sprints,
      users,
      announcements,
    });
  } catch (error) {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
