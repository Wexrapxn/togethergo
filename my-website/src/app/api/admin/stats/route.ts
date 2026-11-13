import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const totalUsers = await prisma.user.count();
    const pendingId = await prisma.user.count({ where: { idCardStatus: "PENDING" } });
    const pendingScreening = await prisma.user.count({ where: { screeningStatus: "PENDING_REVIEW" } });
    const pendingLicenses = await prisma.verificationDocument.count({
      where: { documentType: "DRIVING_LICENSE", status: "PENDING" },
    });
    const totalTrips = await prisma.trip.count();
    const activeEmergencies = await prisma.emergencyAlert.count({ where: { status: "ACTIVE" } });
    const pendingReports = await prisma.report.count({ where: { status: "PENDING" } });

    // Revenue calculation: only for ADMIN
    let totalRevenue = 0;
    let totalPayouts = 0;
    if (isAdmin) {
      const successfulPayments = await prisma.payment.findMany({
        where: { status: "SUCCESS" },
      });
      totalRevenue = successfulPayments.reduce((acc, p) => acc + p.platformFee, 0);

      const payouts = await prisma.hostPayout.findMany({
        where: { status: "TRANSFERRED" },
      });
      totalPayouts = payouts.reduce((acc, p) => acc + p.amount, 0);
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        pendingId,
        pendingScreening,
        pendingLicenses,
        totalTrips,
        activeEmergencies,
        pendingReports,
        totalRevenue: isAdmin ? totalRevenue : null,
        totalPayouts: isAdmin ? totalPayouts : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
