import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list all refund requests / refundable payments
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ status: "SUCCESS" }, { status: "REFUNDED" }],
      },
      include: {
        user: { select: { id: true, username: true, email: true, profile: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Process refund (Refunds lodging share only, retains platform fee)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { paymentId, reason } = body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "REFUNDED") {
      return NextResponse.json({ error: "Already refunded" }, { status: 400 });
    }

    // Refund logic: refund shareAmount (lodging share), platformFee is NOT refunded
    const refundAmount = payment.shareAmount;

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "REFUNDED",
      },
    });

    // Update trip member status to CANCELLED
    await prisma.tripMember.updateMany({
      where: {
        tripId: payment.tripId,
        userId: payment.userId,
      },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Refunded lodging portion ฿${refundAmount} (platform fee ฿${payment.platformFee} retained)`,
      payment: updatedPayment,
      refundAmount,
      reason,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
