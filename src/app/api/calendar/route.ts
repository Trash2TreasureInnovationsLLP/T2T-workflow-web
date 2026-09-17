import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [tasks, milestones, sprints] = await Promise.all([
      // Tasks with due dates
      prisma.task.findMany({
        where: {
          dueDate: { not: null },
        },
        select: {
          id: true,
          taskId: true,
          title: true,
          dueDate: true,
          priority: true,
          status: true,
          project: { select: { name: true } },
          assignee: { select: { fullName: true } },
        },
      }),

      // Project Milestones
      prisma.milestone.findMany({
        select: {
          id: true,
          title: true,
          dueDate: true,
          status: true,
          project: { select: { name: true } },
        },
      }),

      // Sprints
      prisma.sprint.findMany({
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          status: true,
          project: { select: { name: true } },
        },
      }),
    ]);

    // Format into standardized events
    const events: any[] = [];

    tasks.forEach((t) => {
      events.push({
        id: `task-${t.id}`,
        title: `${t.taskId}: ${t.title}`,
        date: t.dueDate,
        type: "TASK_DEADLINE",
        status: t.status,
        priority: t.priority,
        subtitle: `${t.project.name} • ${t.assignee?.fullName || "Unassigned"}`,
        link: `/tasks?highlight=${t.id}`,
      });
    });

    milestones.forEach((m) => {
      events.push({
        id: `milestone-${m.id}`,
        title: `Milestone: ${m.title}`,
        date: m.dueDate,
        type: "PROJECT_MILESTONE",
        status: m.status,
        subtitle: m.project.name,
        link: `/projects`,
      });
    });

    sprints.forEach((s) => {
      events.push({
        id: `sprint-start-${s.id}`,
        title: `Sprint Start: ${s.name}`,
        date: s.startDate,
        type: "SPRINT_DATE",
        status: s.status,
        subtitle: s.project.name,
        link: `/agile`,
      });
      events.push({
        id: `sprint-end-${s.id}`,
        title: `Sprint Target End: ${s.name}`,
        date: s.endDate,
        type: "SPRINT_DATE",
        status: s.status,
        subtitle: s.project.name,
        link: `/agile`,
      });
    });

    return NextResponse.json(events);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load calendar events" }, { status: 500 });
  }
}
