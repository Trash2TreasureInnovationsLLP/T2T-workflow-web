import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { prisma, syncDatabaseToCloud } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/lib/types";
import { syncUserToSupabase } from "@/lib/supabaseDbSync";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        employeeId: true,
        fullName: true,
        role: true,
        designation: true,
        skills: true,
        avatarUrl: true,
        accountStatus: true,
        joiningDate: true,
        lastActive: true,
        department: {
          select: { id: true, name: true, code: true },
        },
        reportingManager: {
          select: { id: true, fullName: true, designation: true, email: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("GET /api/users/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { avatarUrl, fullName, skills } = body;

    const dataToUpdate: any = {};

    if (avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = avatarUrl && avatarUrl.trim() !== "" ? avatarUrl.trim() : null;
    }

    if (fullName !== undefined && typeof fullName === "string" && fullName.trim().length > 0) {
      dataToUpdate.fullName = fullName.trim();
    }

    if (skills !== undefined && typeof skills === "string") {
      dataToUpdate.skills = skills.trim();
    }

    const updatedDbUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
      include: {
        department: true,
        reportingManager: {
          select: { id: true, fullName: true, designation: true, email: true },
        },
      },
    });

    // Log the profile update
    await logActivity({
      userId: currentUser.id,
      action: "UPDATED",
      objectType: "USER",
      objectId: currentUser.id,
      objectTitle: updatedDbUser.fullName,
      details: `User updated personal profile details / avatar picture`,
    });

    const updatedSessionUser: SessionUser = {
      id: updatedDbUser.id,
      email: updatedDbUser.email,
      employeeId: updatedDbUser.employeeId,
      fullName: updatedDbUser.fullName,
      role: updatedDbUser.role as SessionUser["role"],
      designation: updatedDbUser.designation,
      departmentId: updatedDbUser.departmentId,
      departmentName: updatedDbUser.department?.name,
      avatarUrl: updatedDbUser.avatarUrl,
      mustChangePassword: updatedDbUser.mustChangePassword,
      accountStatus: updatedDbUser.accountStatus as SessionUser["accountStatus"],
    };

    const token = signToken(updatedSessionUser);

    const response = NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedDbUser.id,
        email: updatedDbUser.email,
        employeeId: updatedDbUser.employeeId,
        fullName: updatedDbUser.fullName,
        role: updatedDbUser.role,
        designation: updatedDbUser.designation,
        skills: updatedDbUser.skills,
        avatarUrl: updatedDbUser.avatarUrl,
        accountStatus: updatedDbUser.accountStatus,
        joiningDate: updatedDbUser.joiningDate,
        lastActive: updatedDbUser.lastActive,
        department: updatedDbUser.department,
        reportingManager: updatedDbUser.reportingManager,
      },
    });

    // Refresh the auth token cookie
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    await syncUserToSupabase(updatedDbUser);
    await syncDatabaseToCloud();

    return response;
  } catch (error: any) {
    console.error("PATCH /api/users/profile error:", error);
    return NextResponse.json(
      { error: "Failed to update profile", details: error.message },
      { status: 500 }
    );
  }
}
