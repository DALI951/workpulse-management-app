import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-jwt-key-project-app-2026";
const key = new TextEncoder().encode(JWT_SECRET);

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  role: "ADMIN" | "COLLABORATOR";
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, key);
    return {
      id: payload.id as string,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as "ADMIN" | "COLLABORATOR",
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

// Auto-seed default admin if one does not exist
export async function ensureAdminUser(): Promise<void> {
  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });
    if (!existingAdmin) {
      const passwordHash = await hashPassword("admin123");
      await prisma.user.create({
        data: {
          username: "Administrator",
          email: "admin@example.com",
          passwordHash,
          role: "ADMIN",
        },
      });
      console.log("Default admin created: admin@example.com / admin123");
    }
  } catch (error) {
    console.error("Failed to ensure default admin user:", error);
  }
}
