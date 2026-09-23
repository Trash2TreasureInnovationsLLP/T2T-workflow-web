import { NextResponse } from "next/server";
import { getCurrentUser, hashPassword, verifyPassword, signToken, TOKEN_COOKIE_NAME } from "@/lib/auth";
import { prisma, syncDatabaseToCloud } from "@/lib/prisma";
import { logActivity } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    // Verify current password
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (currentPassword) {
      const isMatch = await verifyPassword(currentPassword, dbUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: "Current password does not match our records." },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
      },
    });

    await logActivity({
      userId: user.id,
      action: "PASSWORD_CHANGE",
      objectType: "USER",
      objectId: user.id,
      objectTitle: user.fullName,
      details: "Password was updated successfully.",
    });

    // Re-sign token with mustChangePassword = false
    const updatedUser = {
      ...user,
      mustChangePassword: false,
    };

    await syncDatabaseToCloud();

    const token = signToken(updatedUser);

    const response = NextResponse.json({
      success: true,
      message: "Password updated successfully!",
      user: updatedUser,
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }
}
