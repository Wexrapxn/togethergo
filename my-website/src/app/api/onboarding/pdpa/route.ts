import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { agreed } = body;

    if (!agreed) {
      return NextResponse.json(
        { error: "You must accept the PDPA consent to proceed" },
        { status: 400 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Record consent
    await prisma.consent.create({
      data: {
        userId: user.id,
        consentType: "PDPA",
        version: "1.0",
        agreed: true,
        ipAddress: ip,
        userAgent,
      },
    });

    // Advance onboarding step to 2 if currently at 1
    const nextStep = Math.max(user.onboardingStep, 2);
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep: nextStep },
    });

    return NextResponse.json({
      success: true,
      onboardingStep: nextStep,
    });
  } catch (error: any) {
    console.error("PDPA consent error:", error);
    return NextResponse.json({ error: error.message || "Failed to record consent" }, { status: 500 });
  }
}

// Support revoking consent
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark previous consents as revoked
    await prisma.consent.updateMany({
      where: { userId: user.id, consentType: "PDPA", revokedAt: null },
      data: { revokedAt: new Date(), agreed: false },
    });

    // Demote user status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: false,
        onboardingStep: 1,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Consent has been revoked and onboarding reset",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to revoke consent" }, { status: 500 });
  }
}
