import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
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
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
