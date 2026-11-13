import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "together-go-fallback-secret-2026";
export const AUTH_COOKIE_NAME = "together_go_token";

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  roles: string[];
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        profile: true,
        roles: true,
        emergencyContacts: true,
        consents: true,
        screeningAttempts: {
          orderBy: { attemptDate: "desc" },
          take: 1,
        },
        verificationDocuments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}
