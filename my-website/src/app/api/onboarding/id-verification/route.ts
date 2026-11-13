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
    const { idCardNumber, cardFileUrl, selfieFileUrl } = body;

    if (!idCardNumber || !cardFileUrl || !selfieFileUrl) {
      return NextResponse.json(
        { error: "National ID number, ID card photo, and selfie photo are required" },
        { status: 400 }
      );
    }

    // Mask ID card number for privacy: keep first digit and last 4 digits
    const cleaned = idCardNumber.replace(/\D/g, "");
    if (cleaned.length !== 13) {
      return NextResponse.json(
        { error: "National ID must be 13 digits" },
        { status: 400 }
      );
    }

    const maskedId = `${cleaned[0]}-XXXX-XXXXX-${cleaned.slice(9, 11)}-${cleaned[12]}`;

    // Update profile with masked ID card
    if (user.profile) {
      await prisma.profile.update({
        where: { id: user.profile.id },
        data: { idCardNumber: maskedId },
      });
    }

    // Create Verification Documents
    await prisma.verificationDocument.create({
      data: {
        userId: user.id,
        documentType: "IDCARD",
        fileUrl: cardFileUrl,
        status: "PENDING",
      },
    });

    await prisma.verificationDocument.create({
      data: {
        userId: user.id,
        documentType: "SELFIE_WITH_IDCARD",
        fileUrl: selfieFileUrl,
        status: "PENDING",
      },
    });

    // Update User ID status & advance to step 4
    const nextStep = Math.max(user.onboardingStep, 4);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        idCardStatus: "PENDING",
        onboardingStep: nextStep,
      },
    });

    return NextResponse.json({
      success: true,
      idCardStatus: "PENDING",
      onboardingStep: nextStep,
    });
  } catch (error: any) {
    console.error("ID verification error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit ID verification" }, { status: 500 });
  }
}
