import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { SessionUser, getRolePermissions } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "t2t-jwt-fallback-secret-2026";
const TOKEN_COOKIE_NAME = "t2t_session_token";

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      fullName: user.fullName,
      role: user.role,
      designation: user.designation,
      departmentId: user.departmentId,
      mustChangePassword: user.mustChangePassword,
      accountStatus: user.accountStatus,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionUser;
    return decoded;
  } catch (err) {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    // Verify user is still active in database
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.id },
      include: { department: true },
    });

    if (!dbUser || dbUser.accountStatus !== "ACTIVE") {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      employeeId: dbUser.employeeId,
      fullName: dbUser.fullName,
      role: dbUser.role as SessionUser["role"],
      designation: dbUser.designation,
      departmentId: dbUser.departmentId,
      departmentName: dbUser.department?.name,
      avatarUrl: dbUser.avatarUrl,
      mustChangePassword: dbUser.mustChangePassword,
      accountStatus: dbUser.accountStatus as SessionUser["accountStatus"],
    };
  } catch (error) {
    return null;
  }
}

export { TOKEN_COOKIE_NAME };
