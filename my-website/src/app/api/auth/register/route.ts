import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken, AUTH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email and password are required" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 4) {
      return NextResponse.json(
        { error: "Password must be at least 4 characters long" },
        { status: 400 }
      );
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: cleanUsername }, { email: cleanEmail }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username or email is already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        passwordHash,
        onboardingStep: 1,
        roles: {
          create: [{ role: "USER" }],
        },
      },
      include: {
        roles: true,
        profile: true,
        emergencyContacts: true,
        screeningAttempts: true,
        verificationDocuments: true,
      },
    });

    const token = signToken({
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      roles: ["USER"],
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        isVerified: newUser.isVerified,
        idCardStatus: newUser.idCardStatus,
        screeningStatus: newUser.screeningStatus,
        onboardingStep: newUser.onboardingStep,
        roles: newUser.roles,
        profile: newUser.profile,
        emergencyContacts: newUser.emergencyContacts,
        screeningAttempts: newUser.screeningAttempts,
        verificationDocuments: newUser.verificationDocuments,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
