import { prisma } from "./prisma";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type: "TASK_ASSIGNED" | "SPRINT_UPDATE" | "COMMENT" | "DEADLINE" | "ANNOUNCEMENT" | "SYSTEM";
  link?: string;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        link: params.link,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}
