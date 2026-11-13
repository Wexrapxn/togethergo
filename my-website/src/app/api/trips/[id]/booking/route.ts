import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: get booking for this trip
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: tripId } = params;

    const booking = await prisma.booking.findFirst({
      where: { tripId },
      include: {
        accommodation: true,
        payouts: true,
      },
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: create or update booking for trip accommodation
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: tripId } = params;
    const body = await req.json();
    const { accommodationId, status, checkInDate, checkOutDate, totalAmount } = body;

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN" || r.role === "STAFF");
    if (trip.creatorId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Only creator or staff can manage booking" }, { status: 403 });
    }

    const targetAccId = accommodationId || trip.accommodationId;
    if (!targetAccId) {
      return NextResponse.json({ error: "No accommodation linked to trip" }, { status: 400 });
    }

    const acc = await prisma.accommodation.findUnique({ where: { id: targetAccId } });
    if (!acc) return NextResponse.json({ error: "Accommodation not found" }, { status: 404 });

    const nights = Math.max(
      1,
      Math.round(
        (new Date(checkOutDate || trip.endDate).getTime() -
          new Date(checkInDate || trip.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const amount = totalAmount || acc.pricePerNight * nights;

    // Check if booking already exists
    let booking = await prisma.booking.findFirst({ where: { tripId } });

    if (booking) {
      booking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: status || booking.status,
          totalAmount: amount,
          checkInDate: checkInDate ? new Date(checkInDate) : booking.checkInDate,
          checkOutDate: checkOutDate ? new Date(checkOutDate) : booking.checkOutDate,
        },
      });
    } else {
      booking = await prisma.booking.create({
        data: {
          tripId,
          accommodationId: targetAccId,
          checkInDate: new Date(checkInDate || trip.startDate),
          checkOutDate: new Date(checkOutDate || trip.endDate),
          totalAmount: amount,
          status: status || "PENDING",
        },
      });

      // Also create HostPayout record linked to this booking
      await prisma.hostPayout.create({
        data: {
          bookingId: booking.id,
          hostId: acc.hostId,
          amount,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
