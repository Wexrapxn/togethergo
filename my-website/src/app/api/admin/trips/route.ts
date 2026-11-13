import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list all trips with full detail
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trips = await prisma.trip.findMany({
      include: {
        creator: { select: { id: true, username: true, profile: true } },
        accommodation: true,
        members: { include: { user: { select: { id: true, username: true } } } },
        bookings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, trips });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: update trip status (CANCELLED, COMPLETED, etc.)
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
    const { id, status } = body;

    const updated = await prisma.trip.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, trip: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
