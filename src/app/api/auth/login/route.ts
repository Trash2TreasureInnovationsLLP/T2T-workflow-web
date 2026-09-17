import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email or Employee ID and password are required." },
        { status: 400 }
      );
    }

    // Lookup user by email or employeeId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.trim().toLowerCase() },
          { employeeId: identifier.trim().toUpperCase() },
        ],
      },
      include: {
        department: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your Email/ID and password." },
        { status: 401 }
      );
    }

    if (user.accountStatus !== "ACTIVE") {
      return NextResponse.json(
        { error: `Account is ${user.accountStatus.toLowerCase()}. Please contact Super Admin.` },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid credentials. Please check your password." },
        { status: 401 }
      );
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActive: new Date() },
    });

    // Log login activity
    await logActivity({
      userId: user.id,
      action: "LOGIN",
      objectType: "USER",
      objectId: user.id,
      objectTitle: user.fullName,
      details: `User logged into T2T Operations Platform via ${identifier}`,
    });

    const sessionUser = {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      fullName: user.fullName,
      role: user.role as any,
      designation: user.designation,
      departmentId: user.departmentId,
      departmentName: user.department?.name,
      avatarUrl: user.avatarUrl,
      mustChangePassword: user.mustChangePassword,
      accountStatus: user.accountStatus as any,
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      mustChangePassword: user.mustChangePassword,
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error during login." },
      { status: 500 }
    );
  }
}
