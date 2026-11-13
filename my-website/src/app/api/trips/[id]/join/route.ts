import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Please log in to join trips" }, { status: 401 });
    }

    const { id: tripId } = params;

    // Check verification requirement from PLAN.md
    const isAdmin = user.roles.some((r) => r.role === "ADMIN" || r.role === "STAFF");
    if (!isAdmin && (!user.isVerified || user.screeningStatus !== "PASSED")) {
      return NextResponse.json(
        {
          error: "You must complete ID verification and pass the safety screening before joining trips.",
          requireVerification: true,
        },
        { status: 403 }
      );
    }

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { members: true },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    if (trip.status === "CANCELLED" || trip.status === "COMPLETED") {
      return NextResponse.json({ error: "This trip is no longer open for joining" }, { status: 400 });
    }

    // Check existing membership
    const existingMember = trip.members.find((m) => m.userId === user.id);
    if (existingMember) {
      return NextResponse.json(
        { error: "You have already requested or joined this trip", status: existingMember.status },
        { status: 400 }
      );
    }

    // Check capacity
    const approvedCount = trip.members.filter((m) => m.status === "APPROVED" || m.status === "PAID").length;
    if (approvedCount >= trip.maxMembers) {
      return NextResponse.json({ error: "This trip has reached maximum capacity" }, { status: 400 });
    }

    const newMember = await prisma.tripMember.create({
      data: {
        tripId,
        userId: user.id,
        status: "REQUESTED",
      },
    });

    return NextResponse.json({
      success: true,
      membership: newMember,
    });
  } catch (error: any) {
    console.error("Join trip error:", error);
    return NextResponse.json({ error: error.message || "Failed to join trip" }, { status: 500 });
  }
}
