import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { seedDefaultAdminAndSettings } from "../../../../../prisma/seed";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { usernameOrEmail, password } = body;

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: "Username/Email and password are required" },
        { status: 400 }
      );
    }

    // Ensure default admin exists
    if (usernameOrEmail === "admin" || usernameOrEmail === "admin@togethergo.com") {
      await seedDefaultAdminAndSettings().catch(console.error);
    }

    const trimmed = usernameOrEmail.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: trimmed },
          { email: trimmed },
        ],
      },
      include: {
        roles: true,
        profile: true,
        emergencyContacts: true,
        screeningAttempts: {
          orderBy: { attemptDate: "desc" },
          take: 1,
        },
        verificationDocuments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((r) => r.role),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        idCardStatus: user.idCardStatus,
        screeningStatus: user.screeningStatus,
        onboardingStep: user.onboardingStep,
        roles: user.roles,
        profile: user.profile,
        emergencyContacts: user.emergencyContacts,
        screeningAttempts: user.screeningAttempts,
        verificationDocuments: user.verificationDocuments,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
