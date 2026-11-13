import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Vote for a driver or select driver (creator only)
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = params;
    const body = await req.json();
    const { candidateId, action } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId required" }, { status: 400 });
    }

    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Action: VOTE
    if (action === "VOTE") {
      // Check if already voted in this trip
      const existingVote = await prisma.driverVote.findFirst({
        where: { tripId, voterId: user.id },
      });
      if (existingVote) {
        return NextResponse.json({ error: "Already voted" }, { status: 400 });
      }

      // Check if user is a paid/approved member
      const membership = await prisma.tripMember.findFirst({
        where: {
          tripId,
          userId: user.id,
          status: { in: ["APPROVED", "PAID"] },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Must be a trip member to vote" }, { status: 403 });
      }

      await prisma.driverVote.create({
        data: { tripId, voterId: user.id, candidateId },
      });

      return NextResponse.json({ success: true });
    }

    // Action: SELECT - only trip creator can do this
    if (action === "SELECT") {
      if (trip.creatorId !== user.id) {
        return NextResponse.json({ error: "Only trip creator can select driver" }, { status: 403 });
      }

      // Reset all other driver apps to APPROVED, set this one to SELECTED
      await prisma.driverApplication.updateMany({
        where: { tripId, status: "SELECTED" },
        data: { status: "APPROVED" },
      });

      await prisma.driverApplication.updateMany({
        where: { tripId, userId: candidateId },
        data: { status: "SELECTED" },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
