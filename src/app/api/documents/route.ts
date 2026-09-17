import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const projectId = searchParams.get("projectId");

    const where: any = {};
    if (category && category !== "ALL") where.category = category;
    if (projectId && projectId !== "ALL") where.projectId = projectId;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true, projectId: true } },
        uploadedBy: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, fileName, fileSize = 204800, fileType = "application/pdf", category = "GENERAL", projectId } = body;

    if (!title || !fileName) {
      return NextResponse.json({ error: "Title and file name are required." }, { status: 400 });
    }

    const doc = await prisma.document.create({
      data: {
        title: title.trim(),
        fileName: fileName.trim(),
        fileUrl: `/uploads/${fileName}`,
        fileSize: Number(fileSize) || 102400,
        fileType,
        category,
        projectId: projectId || null,
        uploadedById: user.id,
      },
      include: { uploadedBy: true, project: true },
    });

    await logActivity({
      userId: user.id,
      action: "CREATED",
      objectType: "DOCUMENT",
      objectId: doc.id,
      objectTitle: doc.title,
      newValue: doc.fileName,
      details: `Uploaded by ${user.fullName}`,
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to register document" }, { status: 500 });
  }
}
