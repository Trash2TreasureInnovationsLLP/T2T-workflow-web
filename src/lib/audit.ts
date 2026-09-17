import { prisma } from "./prisma";

interface LogActivityParams {
  userId: string;
  action:
    | "CREATED"
    | "UPDATED"
    | "DELETED"
    | "STATUS_CHANGE"
    | "ASSIGNED"
    | "COMPLETED"
    | "LOGIN"
    | "PASSWORD_CHANGE";
  objectType: "TASK" | "PROJECT" | "SPRINT" | "USER" | "ANNOUNCEMENT" | "DOCUMENT" | "SETTINGS";
  objectId?: string;
  objectTitle: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        objectType: params.objectType,
        objectId: params.objectId,
        objectTitle: params.objectTitle,
        previousValue: params.previousValue,
        newValue: params.newValue,
        details: params.details,
      },
    });
  } catch (error) {
    console.error("Failed to log audit activity:", error);
    return null;
  }
}
