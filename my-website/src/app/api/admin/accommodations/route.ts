import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list all accommodations (all statuses)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const accommodations = await prisma.accommodation.findMany({
      include: {
        host: {
          select: { id: true, username: true, email: true, profile: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, accommodations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add accommodation as admin
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, description, province, address, pricePerNight, maxGuests, imagesJson, hostId } = body;

    const acc = await prisma.accommodation.create({
      data: {
        hostId: hostId || user.id,
        name: name.trim(),
        description: description.trim(),
        province: province.trim(),
        address: address.trim(),
        pricePerNight: parseFloat(pricePerNight),
        maxGuests: parseInt(maxGuests, 10),
        imagesJson: imagesJson || null,
        status: "APPROVED",
      },
    });

    return NextResponse.json({ success: true, accommodation: acc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Approve / Reject accommodation
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body; // action: APPROVE, REJECT

    const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

    const updated = await prisma.accommodation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, accommodation: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
