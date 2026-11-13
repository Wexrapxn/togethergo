import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const createdTrips = await prisma.trip.findMany({
      where: { creatorId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        accommodation: true,
        members: {
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
        roles: true,
      },
    });

    const memberships = await prisma.tripMember.findMany({
      where: {
        userId: user.id,
        trip: { creatorId: { not: user.id } }, // Only trips not created by the user
      },
      orderBy: { joinedAt: "desc" },
      include: {
        trip: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                profile: true,
                isVerified: true,
                screeningStatus: true,
              },
            },
            accommodation: true,
            members: true,
            roles: {
              where: { userId: user.id },
            },
          },
        },
      },
    });

    const joinedTrips = memberships.map((m) => ({
      membershipStatus: m.status,
      joinedAt: m.joinedAt,
      trip: m.trip,
      userRole: m.trip.roles[0]?.roleName || null,
    }));

    return NextResponse.json({
      success: true,
      createdTrips,
      joinedTrips,
    });
  } catch (error: any) {
    console.error("My trips GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
