import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canViewAuditLogs) {
      return NextResponse.json({ error: "Unauthorized. Audit access restricted." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const objectType = searchParams.get("objectType");
    const search = searchParams.get("search");

    const where: any = {};
    if (action && action !== "ALL") where.action = action;
    if (objectType && objectType !== "ALL") where.objectType = objectType;

    if (search) {
      where.OR = [
        { objectTitle: { contains: search } },
        { details: { contains: search } },
        { user: { fullName: { contains: search } } },
      ];
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, fullName: true, email: true, employeeId: true, avatarUrl: true, role: true },
        },
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
