import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: get host's payouts summary
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payouts = await prisma.hostPayout.findMany({
      where: { hostId: user.id },
      include: {
        booking: {
          include: {
            trip: { select: { id: true, title: true, startDate: true, endDate: true } },
            accommodation: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalEarned = payouts
      .filter((p) => p.status === "TRANSFERRED")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({ success: true, payouts, totalEarned, pendingAmount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
