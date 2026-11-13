import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list all host payouts (Admin & Staff)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payouts = await prisma.hostPayout.findMany({
      include: {
        booking: {
          include: {
            trip: { select: { id: true, title: true, startDate: true, endDate: true } },
            accommodation: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, payouts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Record transfer of payout to host (Admin & Staff)
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
    const { payoutId, transferProofUrl, status } = body;

    if (!payoutId) {
      return NextResponse.json({ error: "payoutId is required" }, { status: 400 });
    }

    const updated = await prisma.hostPayout.update({
      where: { id: payoutId },
      data: {
        status: status || "TRANSFERRED",
        transferProofUrl: transferProofUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        transferredAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, payout: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
