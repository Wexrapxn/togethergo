import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const COOLDOWN_DAYS = 3;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find latest screening attempt
    const latestAttempt = await prisma.screeningAttempt.findFirst({
      where: { userId: user.id },
      orderBy: { attemptDate: "desc" },
    });

    if (!latestAttempt) {
      return NextResponse.json({
        hasAttempted: false,
        cooldownActive: false,
        canTakeAssessment: true,
        screeningStatus: user.screeningStatus,
      });
    }

    const now = new Date();
    const isCooldownActive = now < latestAttempt.nextEligibleDate;
    const remainingMs = Math.max(0, latestAttempt.nextEligibleDate.getTime() - now.getTime());
    const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

    return NextResponse.json({
      hasAttempted: true,
      cooldownActive: isCooldownActive,
      canTakeAssessment: !isCooldownActive,
      nextEligibleDate: latestAttempt.nextEligibleDate,
      remainingHours,
      latestStatus: latestAttempt.status,
      latestRiskLevel: latestAttempt.riskLevel,
      latestTotalScore: latestAttempt.totalScore,
      screeningStatus: user.screeningStatus,
    });
  } catch (error: any) {
    console.error("Screening check error:", error);
    return NextResponse.json({ error: error.message || "Failed to check screening status" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { answers } = body;

    if (!Array.isArray(answers) || answers.length < 9) {
      return NextResponse.json(
        { error: "Incomplete assessment answers. Exactly 9 responses are required." },
        { status: 400 }
      );
    }

    // Validate that each answer is a valid integer between 0 and 3
    for (const val of answers) {
      if (typeof val !== "number" || val < 0 || val > 3) {
        return NextResponse.json(
          { error: "Each answer score must be between 0 and 3" },
          { status: 400 }
        );
      }
    }

    // Check cooldown on backend
    const latestAttempt = await prisma.screeningAttempt.findFirst({
      where: { userId: user.id },
      orderBy: { attemptDate: "desc" },
    });

    const now = new Date();
    if (latestAttempt && now < latestAttempt.nextEligibleDate) {
      const remainingMs = latestAttempt.nextEligibleDate.getTime() - now.getTime();
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      return NextResponse.json(
        {
          error: "Assessment cooldown is currently active. Please try again after 3 days.",
          cooldownActive: true,
          remainingHours,
          nextEligibleDate: latestAttempt.nextEligibleDate,
        },
        { status: 429 }
      );
    }

    // CALCULATE SCORE ON BACKEND STRICTLY
    const totalScore = answers.reduce((sum: number, curr: number) => sum + curr, 0);
    const maxPossibleScore = 27;

    // Safety/Risk assessment algorithm:
    // Question 9 is critical emotional distress indicator: answers[8] >= 2 requires staff attention
    let riskLevel = "LOW";
    let status = "PASSED";

    if (totalScore <= 8 && answers[8] < 2) {
      riskLevel = "LOW";
      status = "PASSED";
    } else if (totalScore <= 14) {
      riskLevel = "MODERATE";
      status = "PENDING_REVIEW";
    } else {
      riskLevel = "HIGH";
      status = "PENDING_REVIEW";
    }

    const nextEligibleDate = new Date(Date.now() + COOLDOWN_MS);

    // Save attempt to history
    await prisma.screeningAttempt.create({
      data: {
        userId: user.id,
        answersJson: JSON.stringify(answers),
        totalScore,
        maxPossibleScore,
        riskLevel,
        status,
        nextEligibleDate,
      },
    });

    // Update user status
    const isNowVerified = user.idCardStatus === "APPROVED" && status === "PASSED";
    const nextOnboardingStep = 5; // Step 4 finished, moves to completed overview

    await prisma.user.update({
      where: { id: user.id },
      data: {
        screeningStatus: status,
        isVerified: isNowVerified,
        onboardingStep: nextOnboardingStep,
      },
    });

    return NextResponse.json({
      success: true,
      totalScore,
      riskLevel,
      status,
      nextEligibleDate,
      onboardingStep: nextOnboardingStep,
      isVerified: isNowVerified,
    });
  } catch (error: any) {
    console.error("Screening calculation error:", error);
    return NextResponse.json({ error: error.message || "Failed to process screening" }, { status: 500 });
  }
}
