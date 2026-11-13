import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: get application settings
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: "default",
          platformFeePerUser: 50.0,
          screeningThreshold: 9,
          screeningCooldownDays: 3,
          emailSenderDomain: "noreply@togethergo.com",
        },
      });
    }

    // Hide sensitive SMTP pass if staff
    if (!isAdmin) {
      return NextResponse.json({
        success: true,
        settings: {
          platformFeePerUser: settings.platformFeePerUser,
          screeningThreshold: settings.screeningThreshold,
          screeningCooldownDays: settings.screeningCooldownDays,
          emailSenderDomain: settings.emailSenderDomain,
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST/PUT: update settings (ADMIN ONLY)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only Admin can update settings" }, { status: 403 });
    }

    const body = await req.json();
    const {
      platformFeePerUser,
      screeningThreshold,
      screeningCooldownDays,
      emailSenderDomain,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpEnabled,
    } = body;

    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      update: {
        platformFeePerUser: platformFeePerUser !== undefined ? parseFloat(platformFeePerUser) : undefined,
        screeningThreshold: screeningThreshold !== undefined ? parseInt(screeningThreshold, 10) : undefined,
        screeningCooldownDays: screeningCooldownDays !== undefined ? parseInt(screeningCooldownDays, 10) : undefined,
        emailSenderDomain: emailSenderDomain !== undefined ? emailSenderDomain.trim() : undefined,
        smtpHost: smtpHost !== undefined ? smtpHost.trim() : undefined,
        smtpPort: smtpPort !== undefined ? parseInt(smtpPort, 10) : undefined,
        smtpUser: smtpUser !== undefined ? smtpUser.trim() : undefined,
        smtpPass: smtpPass !== undefined ? smtpPass : undefined,
        smtpEnabled: smtpEnabled !== undefined ? Boolean(smtpEnabled) : undefined,
      },
      create: {
        id: "default",
        platformFeePerUser: parseFloat(platformFeePerUser || "50"),
        screeningThreshold: parseInt(screeningThreshold || "9", 10),
        screeningCooldownDays: parseInt(screeningCooldownDays || "3", 10),
        emailSenderDomain: emailSenderDomain || "noreply@togethergo.com",
        smtpHost: smtpHost || "",
        smtpPort: parseInt(smtpPort || "587", 10),
        smtpUser: smtpUser || "",
        smtpPass: smtpPass || "",
        smtpEnabled: Boolean(smtpEnabled),
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
