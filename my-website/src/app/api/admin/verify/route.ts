import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const adminUser = await getCurrentUser();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = adminUser.roles.some((r) => r.role === "ADMIN" || r.role === "STAFF");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin or Staff role required" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, action, reason } = body;
    // action: "APPROVE_ID", "REJECT_ID", "APPROVE_SCREENING", "REJECT_SCREENING", "APPROVE_LICENSE", "REJECT_LICENSE"

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { verificationDocuments: true, profile: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    if (action === "APPROVE_ID") {
      const willBeVerified = targetUser.screeningStatus === "PASSED";
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          idCardStatus: "APPROVED",
          isVerified: willBeVerified,
        },
      });

      await prisma.verificationDocument.updateMany({
        where: {
          userId: targetUserId,
          documentType: { in: ["IDCARD", "SELFIE_WITH_IDCARD"] },
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
          reviewedBy: adminUser.username,
          reviewedAt: new Date(),
        },
      });

      // Send IDENTITY_APPROVED email notification
      if (willBeVerified) {
        await sendNotificationEmail({
          recipient: {
            email: targetUser.email,
            name: targetUser.profile?.fullName || targetUser.username,
          },
          eventType: "IDENTITY_APPROVED",
          relatedId: targetUserId,
        });
      }
    } else if (action === "REJECT_ID") {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          idCardStatus: "REJECTED",
          isVerified: false,
        },
      });

      await prisma.verificationDocument.updateMany({
        where: {
          userId: targetUserId,
          documentType: { in: ["IDCARD", "SELFIE_WITH_IDCARD"] },
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          rejectionReason: reason || "เอกสารไม่ชัดเจนหรือไม่ถูกต้อง",
          reviewedBy: adminUser.username,
          reviewedAt: new Date(),
        },
      });
    } else if (action === "APPROVE_SCREENING") {
      const willBeVerified = targetUser.idCardStatus === "APPROVED";
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          screeningStatus: "PASSED",
          isVerified: willBeVerified,
        },
      });

      if (willBeVerified) {
        await sendNotificationEmail({
          recipient: {
            email: targetUser.email,
            name: targetUser.profile?.fullName || targetUser.username,
          },
          eventType: "IDENTITY_APPROVED",
          relatedId: targetUserId,
        });
      }
    } else if (action === "REJECT_SCREENING") {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          screeningStatus: "FAILED",
          isVerified: false,
        },
      });
    } else if (action === "APPROVE_LICENSE") {
      // Approve driving license
      await prisma.verificationDocument.updateMany({
        where: {
          userId: targetUserId,
          documentType: "DRIVING_LICENSE",
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
          reviewedBy: adminUser.username,
          reviewedAt: new Date(),
        },
      });
    } else if (action === "REJECT_LICENSE") {
      await prisma.verificationDocument.updateMany({
        where: {
          userId: targetUserId,
          documentType: "DRIVING_LICENSE",
          status: "PENDING",
        },
        data: {
          status: "REJECTED",
          rejectionReason: reason || "ใบขับขี่ไม่ชัดเจนหรือไม่ถูกต้อง",
          reviewedBy: adminUser.username,
          reviewedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, action });
  } catch (error: any) {
    console.error("Admin verify action error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
