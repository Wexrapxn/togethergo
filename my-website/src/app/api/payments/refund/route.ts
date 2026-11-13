import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Request cancellation & refund (Only lodging portion is refunded, platform fee is kept)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tripId } = body;

    if (!tripId) return NextResponse.json({ error: "tripId is required" }, { status: 400 });

    // Check membership
    const membership = await prisma.tripMember.findFirst({
      where: { tripId, userId: user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this trip" }, { status: 404 });
    }

    // Find successful payment for this trip
    const payment = await prisma.payment.findFirst({
      where: { tripId, userId: user.id, status: "SUCCESS" },
    });

    let refundedAmount = 0;
    let retainedFee = 0;

    if (payment) {
      // Refund lodging share only, keep platform fee
      refundedAmount = payment.shareAmount;
      retainedFee = payment.platformFee;

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "REFUNDED" },
      });
    }

    // Update membership status to CANCELLED
    await prisma.tripMember.update({
      where: { id: membership.id },
      data: { status: "CANCELLED" },
    });

    // Also remove from any claimed role in the trip
    await prisma.tripRole.updateMany({
      where: { tripId, userId: user.id },
      data: { userId: null },
    });

    return NextResponse.json({
      success: true,
      message: payment
        ? `Cancelled. Refunded lodging portion ฿${refundedAmount.toLocaleString()} (Platform fee ฿${retainedFee} retained).`
        : "Membership cancelled.",
      refundedAmount,
      retainedFee,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
