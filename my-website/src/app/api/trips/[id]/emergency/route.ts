import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Trigger SOS Emergency Alert
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: tripId } = params;
    const body = await req.json();
    const { latitude, longitude, notes } = body;

    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: "Latitude and Longitude required" }, { status: 400 });
    }

    // Create EmergencyAlert in database
    const alert = await prisma.emergencyAlert.create({
      data: {
        tripId,
        userId: user.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        notes: notes?.trim() || null,
        status: "ACTIVE",
      },
      include: {
        user: {
          include: {
            profile: true,
            emergencyContacts: true,
          },
        },
        trip: {
          select: { id: true, title: true, province: true },
        },
      },
    });

    const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

    return NextResponse.json({
      success: true,
      alert,
      googleMapsUrl,
      emergencyContacts: user.emergencyContacts || [],
      helplines: {
        police: "191",
        ambulance: "1669",
        mentalHealth: "1323",
        touristPolice: "1155",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
