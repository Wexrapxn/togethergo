import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendNotificationEmail } from "@/lib/email";

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
    const { targetUserId, action } = body; // action: "APPROVE" | "REJECT"

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: true,
        accommodation: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    // Only trip creator or admin can manage members
    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    if (trip.creatorId !== user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: Only trip creator can manage members" }, { status: 403 });
    }

    const memberRecord = trip.members.find((m) => m.userId === targetUserId);
    if (!memberRecord) {
      return NextResponse.json({ error: "Member record not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      // Check capacity
      const approvedCount = trip.members.filter((m) => m.status === "APPROVED" || m.status === "PAID").length;
      if (approvedCount >= trip.maxMembers) {
        return NextResponse.json({ error: "Cannot approve: trip is full" }, { status: 400 });
      }

      await prisma.tripMember.update({
        where: { id: memberRecord.id },
        data: { status: "APPROVED" },
      });

      // Target user details for email
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: { profile: true },
      });

      if (targetUser) {
        const nights = Math.max(
          1,
          Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24))
        );
        const accPrice = trip.accommodation?.pricePerNight || 0;
        const accShare = Math.round((accPrice * nights) / trip.maxMembers);
        const totalDue = accShare + 50;

        await sendNotificationEmail({
          recipient: {
            email: targetUser.email,
            name: targetUser.profile?.fullName || targetUser.username,
          },
          eventType: "TRIP_JOIN_APPROVED",
          data: {
            tripTitle: trip.title,
            amount: totalDue,
            paymentLink: `/trips/${trip.id}`,
          },
          relatedId: trip.id,
        });
      }
    } else if (action === "REJECT") {
      await prisma.tripMember.update({
        where: { id: memberRecord.id },
        data: { status: "CANCELLED" },
      });
    }

    return NextResponse.json({ success: true, action });
  } catch (error: any) {
    console.error("Manage member error:", error);
    return NextResponse.json({ error: error.message || "Failed to manage member" }, { status: 500 });
  }
}
