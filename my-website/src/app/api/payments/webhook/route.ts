import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendNotificationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Payment Webhook Handler (Test/Sandbox simulated gateway callback)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { paymentId, gatewayRef, status, event } = body;

    // Locate the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: paymentId || "" },
          { gatewayRef: gatewayRef || "" },
        ],
      },
      include: {
        user: { select: { id: true, email: true, username: true, profile: true } },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    const newStatus = (status || event === "charge.success" || event === "PAYMENT_SUCCESS") ? "SUCCESS" : "FAILED";

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus },
    });

    if (newStatus === "SUCCESS") {
      // Update TripMember status to PAID
      await prisma.tripMember.updateMany({
        where: {
          tripId: payment.tripId,
          userId: payment.userId,
        },
        data: {
          status: "PAID",
        },
      });

      // Fetch trip details for email
      const trip = await prisma.trip.findUnique({ where: { id: payment.tripId } });

      // Trigger PAYMENT_SUCCESS email notification
      await sendNotificationEmail({
        recipient: {
          email: payment.user.email,
          name: payment.user.profile?.fullName || payment.user.username,
        },
        eventType: "PAYMENT_SUCCESS",
        data: {
          tripTitle: trip?.title || "ทริปท่องเที่ยว",
          amount: payment.amount,
          paymentRef: payment.gatewayRef || payment.id,
        },
        relatedId: payment.id,
      });
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      memberStatus: newStatus === "SUCCESS" ? "PAID" : "PENDING",
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
