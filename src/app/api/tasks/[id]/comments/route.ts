import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { content } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty." }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: { assignee: true, createdBy: true },
    });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const comment = await prisma.taskComment.create({
      data: {
        taskId: params.id,
        authorId: user.id,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true, role: true },
        },
      },
    });

    // Notify assignee or creator if someone else commented
    const recipientId = task.assigneeId === user.id ? task.createdById : task.assigneeId;
    if (recipientId && recipientId !== user.id) {
      await createNotification({
        userId: recipientId,
        title: `New Comment on ${task.taskId}`,
        message: `${user.fullName} commented: "${content.slice(0, 60)}..."`,
        type: "COMMENT",
        link: `/tasks?highlight=${task.id}`,
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
