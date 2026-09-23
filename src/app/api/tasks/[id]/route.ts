import { NextResponse } from "next/server";
import { prisma, syncDatabaseToCloud } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: true,
        createdBy: true,
        project: true,
        sprint: true,
        comments: {
          include: {
            author: {
              select: { id: true, fullName: true, avatarUrl: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

// PATCH: quick update (status change for Kanban drag-drop, effort, blockers)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: { assignee: true, project: true },
    });

    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const permissions = getRolePermissions(user.role);
    // Non-admins can only update their own assigned tasks
    const isAssignee = existingTask.assigneeId === user.id;
    if (permissions.isAdvisoryOnly) {
      return NextResponse.json(
        { error: "Advisory role cannot mutate task operational status." },
        { status: 403 }
      );
    }
    if (!permissions.canEditAllTasks && !isAssignee) {
      return NextResponse.json(
        { error: "You can only update tasks assigned to you." },
        { status: 403 }
      );
    }

    const updateData: any = {};
    let statusChanged = false;

    if (body.status && body.status !== existingTask.status) {
      updateData.status = body.status;
      statusChanged = true;
      if (body.status === "COMPLETED") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    if (body.priority) updateData.priority = body.priority;
    if (body.blockers !== undefined) updateData.blockers = body.blockers;
    if (body.actualEffort !== undefined) updateData.actualEffort = Number(body.actualEffort);

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignee: true,
        project: true,
        sprint: true,
      },
    });

    // Log status change audit
    if (statusChanged) {
      await logActivity({
        userId: user.id,
        action: body.status === "COMPLETED" ? "COMPLETED" : "STATUS_CHANGE",
        objectType: "TASK",
        objectId: updatedTask.id,
        objectTitle: `${updatedTask.taskId}: ${updatedTask.title}`,
        previousValue: existingTask.status,
        newValue: body.status,
        details: `${user.fullName} changed status from ${existingTask.status} to ${body.status}`,
      });

      // If moved to BLOCKED, notify project manager or creator
      if (body.status === "BLOCKED") {
        await createNotification({
          userId: existingTask.createdById,
          title: `Task Blocked: ${updatedTask.taskId}`,
          message: `${user.fullName} marked ${updatedTask.title} as BLOCKED. Reason: ${
            body.blockers || "Not specified"
          }`,
          type: "SYSTEM",
          link: `/kanban`,
        });
      }
    }

    await syncDatabaseToCloud();

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task PATCH error:", error);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}

// PUT: full task update
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const existingTask = await prisma.task.findUnique({ where: { id: params.id } });
    if (!existingTask) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canEditAllTasks && existingTask.createdById !== user.id) {
      return NextResponse.json({ error: "Unauthorized to edit this task." }, { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        projectId: body.projectId,
        sprintId: body.sprintId || null,
        assigneeId: body.assigneeId || null,
        priority: body.priority,
        status: body.status,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        estimatedEffort: Number(body.estimatedEffort) || 0,
        actualEffort: Number(body.actualEffort) || 0,
        storyPoints: Number(body.storyPoints) || 1,
        tags: body.tags || "",
        blockers: body.blockers || null,
        completedAt: body.status === "COMPLETED" ? new Date() : null,
      },
      include: {
        assignee: true,
        project: true,
        sprint: true,
      },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATED",
      objectType: "TASK",
      objectId: updatedTask.id,
      objectTitle: `${updatedTask.taskId}: ${updatedTask.title}`,
      details: `Task updated by ${user.fullName}`,
    });

    await syncDatabaseToCloud();

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Task PUT error:", error);
    return NextResponse.json({ error: "Failed to update task." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canEditAllTasks) {
      return NextResponse.json({ error: "Only leadership can delete tasks." }, { status: 403 });
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    await prisma.task.delete({ where: { id: params.id } });

    await logActivity({
      userId: user.id,
      action: "DELETED",
      objectType: "TASK",
      objectId: params.id,
      objectTitle: `${task.taskId}: ${task.title}`,
      details: `Deleted by ${user.fullName}`,
    });

    await syncDatabaseToCloud();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
