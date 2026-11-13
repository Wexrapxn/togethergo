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
    const {
      fullName,
      nickname,
      phone,
      gender,
      birthDate,
      bio,
      emergencyName,
      emergencyRelationship,
      emergencyPhone,
      emergencyAltPhone,
    } = body;

    if (!fullName || !phone || !emergencyName || !emergencyRelationship || !emergencyPhone) {
      return NextResponse.json(
        { error: "Please provide all required profile and emergency contact fields" },
        { status: 400 }
      );
    }

    // Upsert Profile
    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        fullName,
        nickname: nickname || null,
        phone,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        bio: bio || null,
      },
      create: {
        userId: user.id,
        fullName,
        nickname: nickname || null,
        phone,
        gender: gender || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        bio: bio || null,
      },
    });

    // Upsert Emergency Contact
    const existingContact = await prisma.emergencyContact.findFirst({
      where: { userId: user.id },
    });

    if (existingContact) {
      await prisma.emergencyContact.update({
        where: { id: existingContact.id },
        data: {
          name: emergencyName,
          relationship: emergencyRelationship,
          phone: emergencyPhone,
          altPhone: emergencyAltPhone || null,
        },
      });
    } else {
      await prisma.emergencyContact.create({
        data: {
          userId: user.id,
          name: emergencyName,
          relationship: emergencyRelationship,
          phone: emergencyPhone,
          altPhone: emergencyAltPhone || null,
        },
      });
    }

    // Advance step to 3 if currently at step 2 or 1
    const nextStep = Math.max(user.onboardingStep, 3);
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep: nextStep },
    });

    return NextResponse.json({
      success: true,
      onboardingStep: nextStep,
    });
  } catch (error: any) {
    console.error("Profile onboarding error:", error);
    return NextResponse.json({ error: error.message || "Failed to save profile" }, { status: 500 });
  }
}
