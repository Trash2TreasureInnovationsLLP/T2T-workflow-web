import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma, syncDatabaseToCloud, syncDatabaseFromCloud } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { getRolePermissions } from "@/lib/types";
import { logActivity } from "@/lib/audit";
import { syncUserToSupabase, syncDepartmentToSupabase } from "@/lib/supabaseDbSync";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await syncDatabaseFromCloud();

    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: any = {};
    if (departmentId && departmentId !== "ALL") where.departmentId = departmentId;
    if (role && role !== "ALL") where.role = role;
    if (status && status !== "ALL") where.accountStatus = status;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        employeeId: true,
        fullName: true,
        role: true,
        designation: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        accountStatus: true,
        joiningDate: true,
        lastActive: true,
        avatarUrl: true,
        skills: true,
        reportingManager: { select: { id: true, fullName: true } },
        _count: {
          select: {
            assignedTasks: true,
            projectMemberships: true,
          },
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const permissions = getRolePermissions(user.role);
    if (!permissions.canManageUsers) {
      return NextResponse.json({ error: "Unauthorized. Super Admin only." }, { status: 403 });
    }

    const body = await req.json();
    const {
      fullName,
      email,
      role = "EMPLOYEE",
      departmentId,
      newDepartmentName,
      designation,
      reportingManagerId,
      skills = "",
      temporaryPassword,
    } = body;

    if (!fullName || !email || !designation) {
      return NextResponse.json(
        { error: "Full Name, Email, and Designation are required." },
        { status: 400 }
      );
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    // Generate safe sequential Employee ID e.g. T2T-002
    const allUsers = await prisma.user.findMany({
      select: { employeeId: true },
    });
    let maxId = 0;
    for (const u of allUsers) {
      const match = u.employeeId?.match(/T2T-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxId) maxId = num;
      }
    }
    const employeeId = `T2T-${String(maxId + 1).padStart(3, "0")}`;

    // Verify department exists before linking to avoid FK constraint errors
    let validDeptId: string | null = null;
    if (newDepartmentName && newDepartmentName.trim()) {
      const dName = newDepartmentName.trim();
      let dept = await prisma.department.findFirst({ where: { name: dName } });
      if (!dept) {
        const dCode = (dName.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "DEPT") + Math.floor(10 + Math.random() * 90);
        try {
          dept = await prisma.department.create({
            data: {
              name: dName,
              code: dCode,
              description: `${dName} Division`,
            },
          });
        } catch (e) {
          dept = await prisma.department.findFirst({ where: { name: dName } });
        }
      }
      if (dept) validDeptId = dept.id;
    } else if (departmentId && departmentId !== "__NEW__") {
      const deptExists = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (deptExists) {
        validDeptId = deptExists.id;
      } else {
        const deptByName = await prisma.department.findFirst({
          where: {
            OR: [
              { name: departmentId },
              { code: departmentId },
            ],
          },
        });
        if (deptByName) validDeptId = deptByName.id;
      }
      if (!validDeptId && departmentId.trim()) {
        const dName = departmentId.trim();
        const dCode = (dName.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4) || "DEPT") + Math.floor(10 + Math.random() * 90);
        try {
          const newDept = await prisma.department.create({
            data: {
              name: dName,
              code: dCode,
              description: `${dName} Division`,
            },
          });
          validDeptId = newDept.id;
        } catch (e) {
          // If code collided or concurrent, try finding by name
          const fallback = await prisma.department.findFirst({ where: { name: dName } });
          if (fallback) validDeptId = fallback.id;
        }
      }
    }

    const tempPass = temporaryPassword || "T2T@Temp2026!";
    const passwordHash = await hashPassword(tempPass);

    const newUser = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        employeeId,
        fullName: fullName.trim(),
        passwordHash,
        mustChangePassword: true, // Forces password change on first login
        role,
        departmentId: validDeptId,
        designation: designation.trim(),
        reportingManagerId: reportingManagerId || null,
        skills: skills.trim(),
        accountStatus: "ACTIVE",
      },
      include: {
        department: true,
      },
    });

    await logActivity({
      userId: user.id,
      action: "CREATED",
      objectType: "USER",
      objectId: newUser.id,
      objectTitle: `${newUser.fullName} (${newUser.employeeId})`,
      newValue: `Role: ${role}, Department: ${newUser.department?.name || "None"}`,
      details: `Created by ${user.fullName}. Temporary credentials issued.`,
    });

    revalidatePath("/users");
    revalidatePath("/api/users");

    await syncUserToSupabase(newUser);
    await syncDatabaseToCloud();

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          employeeId: newUser.employeeId,
          fullName: newUser.fullName,
          role: newUser.role,
          designation: newUser.designation,
          departmentId: newUser.departmentId,
          department: newUser.department
            ? {
                id: newUser.department.id,
                name: newUser.department.name,
                code: newUser.department.code,
              }
            : null,
          accountStatus: newUser.accountStatus,
          joiningDate: newUser.joiningDate,
          lastActive: newUser.lastActive,
          avatarUrl: newUser.avatarUrl,
          skills: newUser.skills,
          reportingManager: null,
          _count: {
            assignedTasks: 0,
            projectMemberships: 0,
          },
        },
        temporaryPassword: tempPass,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("User POST error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create user." }, { status: 500 });
  }
}
