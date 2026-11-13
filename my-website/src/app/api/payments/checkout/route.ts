import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: get checkout breakdown for a trip member
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");

    if (!tripId) return NextResponse.json({ error: "tripId is required" }, { status: 400 });

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        accommodation: true,
        members: { where: { userId: user.id } },
      },
    });

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    const platformFee = settings?.platformFeePerUser ?? 50.0;

    const nights = Math.max(
      1,
      Math.round(
        (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const accPrice = trip.accommodation?.pricePerNight || 0;
    const accTotal = accPrice * nights;
    const accSharePerPerson = Math.round(accTotal / trip.maxMembers);
    const totalAmount = accSharePerPerson + platformFee;

    const membership = trip.members[0] || null;

    // Check existing payment
    const existingPayment = await prisma.payment.findFirst({
      where: { tripId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      trip: {
        id: trip.id,
        title: trip.title,
        province: trip.province,
        startDate: trip.startDate,
        endDate: trip.endDate,
        maxMembers: trip.maxMembers,
        accommodation: trip.accommodation,
      },
      breakdown: {
        nights,
        accPricePerNight: accPrice,
        accTotal,
        accSharePerPerson,
        platformFee,
        totalAmount,
      },
      membershipStatus: membership?.status || "NOT_JOINED",
      existingPayment,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create checkout session (Sandbox/Test mode)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tripId } = body;

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        accommodation: true,
        members: { where: { userId: user.id } },
      },
    });

    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const membership = trip.members[0];
    if (!membership || (membership.status !== "APPROVED" && membership.status !== "REQUESTED")) {
      return NextResponse.json(
        { error: "Must be an approved member to make payment" },
        { status: 400 }
      );
    }

    const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    const platformFee = settings?.platformFeePerUser ?? 50.0;

    const nights = Math.max(
      1,
      Math.round(
        (new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const accPrice = trip.accommodation?.pricePerNight || 0;
    const accTotal = accPrice * nights;
    const accShare = Math.round(accTotal / trip.maxMembers);
    const totalAmount = accShare + platformFee;

    const gatewayRef = `SANDBOX-TG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        tripId: trip.id,
        amount: totalAmount,
        platformFee,
        shareAmount: accShare,
        status: "PENDING",
        gatewayRef,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      gatewayRef,
      amount: totalAmount,
      sandbox: true,
      message: "Ready for payment in Sandbox mode",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
