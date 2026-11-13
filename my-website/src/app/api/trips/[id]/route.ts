import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const currentUser = await getCurrentUser();

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            isVerified: true,
            screeningStatus: true,
            profile: true,
          },
        },
        accommodation: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isVerified: true,
                screeningStatus: true,
                profile: true,
              },
            },
          },
        },
        roles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Calculations
    const nights = Math.max(
      1,
      Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    const accPrice = trip.accommodation?.pricePerNight || 0;
    const accTotal = accPrice * nights;
    const accPerPerson = Math.round(accTotal / trip.maxMembers);
    const fuelTotal = trip.totalFuelDistance * trip.fuelPricePerLiter;
    const fuelPerPerson = Math.round(fuelTotal / trip.maxMembers);
    const platformFee = 50;
    const totalEstimatedCost = accPerPerson + fuelPerPerson + platformFee;

    const approvedMembers = trip.members.filter(
      (m) => m.status === "APPROVED" || m.status === "PAID"
    );
    const seatsLeft = Math.max(0, trip.maxMembers - approvedMembers.length);

    // Membership of current user
    let userMembership = null;
    let isCreator = false;
    if (currentUser) {
      isCreator = trip.creatorId === currentUser.id;
      userMembership = trip.members.find((m) => m.userId === currentUser.id) || null;
    }

    return NextResponse.json({
      success: true,
      trip: {
        ...trip,
        nights,
        days: nights + 1,
        costBreakdown: {
          accTotal,
          accPerPerson,
          fuelTotal,
          fuelPerPerson,
          platformFee,
          totalEstimatedCost,
        },
        seatsLeft,
        approvedMembersCount: approvedMembers.length,
      },
      userMembership,
      isCreator,
    });
  } catch (error: any) {
    console.error("Trip detail GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch trip" }, { status: 500 });
  }
}
