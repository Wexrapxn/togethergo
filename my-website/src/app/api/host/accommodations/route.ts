import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Get host's own accommodations
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accommodations = await prisma.accommodation.findMany({
      where: { hostId: user.id },
      include: {
        bookings: {
          include: {
            trip: { select: { id: true, title: true, startDate: true, endDate: true } },
            payouts: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, accommodations });
  } catch (error: any) {
    console.error("Host accommodations GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create new accommodation
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user has HOST role
    const isHost = user.roles.some((r) => r.role === "HOST" || r.role === "ADMIN");
    if (!isHost) {
      return NextResponse.json({ error: "Must be a Host to add accommodation" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, province, address, pricePerNight, maxGuests, imagesJson } = body;

    if (!name || !description || !province || !address || !pricePerNight || !maxGuests) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const acc = await prisma.accommodation.create({
      data: {
        hostId: user.id,
        name: name.trim(),
        description: description.trim(),
        province: province.trim(),
        address: address.trim(),
        pricePerNight: parseFloat(pricePerNight),
        maxGuests: parseInt(maxGuests, 10),
        imagesJson: imagesJson || null,
        status: user.roles.some((r) => r.role === "ADMIN") ? "APPROVED" : "PENDING",
      },
    });

    return NextResponse.json({ success: true, accommodation: acc });
  } catch (error: any) {
    console.error("Host accommodation POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Update accommodation
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, description, province, address, pricePerNight, maxGuests, imagesJson } = body;

    const acc = await prisma.accommodation.findUnique({ where: { id } });
    if (!acc || acc.hostId !== user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    const updated = await prisma.accommodation.update({
      where: { id },
      data: {
        name: name?.trim(),
        description: description?.trim(),
        province: province?.trim(),
        address: address?.trim(),
        pricePerNight: pricePerNight ? parseFloat(pricePerNight) : undefined,
        maxGuests: maxGuests ? parseInt(maxGuests, 10) : undefined,
        imagesJson: imagesJson || undefined,
        status: "PENDING", // reset to pending on edit
      },
    });

    return NextResponse.json({ success: true, accommodation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
