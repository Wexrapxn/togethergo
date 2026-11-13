import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Submit a user report
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reportedUserId, tripId, reason, details } = body;

    if (!reportedUserId || !reason || !details) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (reportedUserId === user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedUserId,
        tripId: tripId || null,
        reason: reason.trim(),
        details: details.trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
