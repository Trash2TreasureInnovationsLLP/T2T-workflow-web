import { NextResponse } from "next/server";
import { prisma, syncDatabaseToCloud, syncDatabaseFromCloud } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await syncDatabaseFromCloud();

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const sprintId = searchParams.get("sprintId");
    const assigneeId = searchParams.get("assigneeId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");

    const where: any = {};

    if (projectId && projectId !== "ALL") where.projectId = projectId;
    if (sprintId && sprintId !== "ALL") where.sprintId = sprintId;
    if (assigneeId && assigneeId !== "ALL") where.assigneeId = assigneeId;
    if (status && status !== "ALL") where.status = status;
    if (priority && priority !== "ALL") where.priority = priority;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { taskId: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: {
          select: { id: true, fullName: true, employeeId: true, avatarUrl: true, designation: true },
        },
        createdBy: {
          select: { id: true, fullName: true },
        },
        project: {
          select: { id: true, name: true, projectId: true },
        },
        sprint: {
          select: { id: true, name: true, status: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Tasks GET error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canCreateTasks) {
      return NextResponse.json(
        { error: "You do not have permission to create tasks." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      projectId,
      newProjectName,
      sprintId,
      newSprintName,
      assigneeId,
      priority = "MEDIUM",
      status = "TODO",
      dueDate,
      estimatedEffort = 0,
      storyPoints = 1,
      tags = "",
      blockers = "",
    } = body;

    let finalProjectId = projectId;

    // Handle inline new project creation if selected or specified
    if (newProjectName || projectId === "__NEW__" || (projectId && projectId.startsWith("NEW:"))) {
      const projName = (newProjectName || projectId.replace(/^NEW:/, "")).trim();
      if (!projName) {
        return NextResponse.json({ error: "Project name cannot be empty." }, { status: 400 });
      }

      let existingProject = await prisma.project.findFirst({
        where: {
          OR: [
            { name: projName },
            { projectId: projName.toUpperCase() },
          ],
        },
      });

      if (!existingProject) {
        const prjCount = await prisma.project.count();
        const pCode = `T2T-PRJ-${String(prjCount + 1).padStart(2, "0")}`;
        existingProject = await prisma.project.create({
          data: {
            projectId: pCode,
            name: projName,
            description: `Project initiative: ${projName}`,
            managerId: user.id,
            startDate: new Date(),
            targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: "ACTIVE",
            priority: "HIGH",
          },
        });
      }
      finalProjectId = existingProject.id;
    }

    if (!title || !finalProjectId || finalProjectId === "__NEW__") {
      return NextResponse.json(
        { error: "Task title and project selection are required." },
        { status: 400 }
      );
    }

    // Handle inline new sprint creation if specified
    let finalSprintId = sprintId === "__NEW__" ? null : sprintId;
    if (newSprintName || (sprintId && sprintId.startsWith("NEW:"))) {
      const sName = (newSprintName || sprintId.replace(/^NEW:/, "")).trim();
      if (sName) {
        const newSprint = await prisma.sprint.create({
          data: {
            name: sName,
            goal: `Sprint goal for ${sName}`,
            startDate: new Date(),
            endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: "ACTIVE",
            projectId: finalProjectId,
          },
        });
        finalSprintId = newSprint.id;
      }
    }

    // Auto-generate next task ID (e.g. T2T-1001)
    const allTasks = await prisma.task.findMany({ select: { taskId: true } });
    let maxTaskNum = 1000;
    for (const t of allTasks) {
      const match = t.taskId?.match(/T2T-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxTaskNum) maxTaskNum = num;
      }
    }
    const taskId = `T2T-${maxTaskNum + 1}`;

    const newTask = await prisma.task.create({
      data: {
        taskId,
        title: title.trim(),
        description: description?.trim() || "",
        projectId: finalProjectId,
        sprintId: finalSprintId || null,
        assigneeId: assigneeId || null,
        createdById: user.id,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedEffort: Number(estimatedEffort) || 0,
        storyPoints: Number(storyPoints) || 1,
        tags: tags?.trim() || "",
        blockers: blockers?.trim() || null,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
      include: {
        assignee: true,
        project: true,
        sprint: true,
      },
    });

    // Log Activity
    await logActivity({
      userId: user.id,
      action: "CREATED",
      objectType: "TASK",
      objectId: newTask.id,
      objectTitle: `${newTask.taskId}: ${newTask.title}`,
      newValue: `Status: ${status}, Priority: ${priority}`,
      details: `Created in project ${newTask.project.name}`,
    });

    // Notify assignee if different from creator
    if (assigneeId && assigneeId !== user.id) {
      await createNotification({
        userId: assigneeId,
        title: "New Task Assigned",
        message: `${user.fullName} assigned you to ${newTask.taskId}: ${newTask.title}`,
        type: "TASK_ASSIGNED",
        link: `/tasks?highlight=${newTask.id}`,
      });
    }

    await syncDatabaseToCloud();

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Tasks POST error:", error);
    return NextResponse.json({ error: "Failed to create task." }, { status: 500 });
  }
}
