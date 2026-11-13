import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: list all screening attempts with past history per user
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (userId) {
      // Get all attempts for specific user
      const attempts = await prisma.screeningAttempt.findMany({
        where: { userId },
        orderBy: { attemptDate: "desc" },
      });
      return NextResponse.json({ success: true, attempts });
    }

    // Get all pending review screenings
    const pendingScreenings = await prisma.screeningAttempt.findMany({
      where: { status: "PENDING_REVIEW" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            profile: true,
            screeningAttempts: {
              orderBy: { attemptDate: "desc" },
            },
          },
        },
      },
      orderBy: { attemptDate: "desc" },
    });

    return NextResponse.json({ success: true, screenings: pendingScreenings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add review notes and approve/reject
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
    const { attemptId, action, reviewNotes } = body; // action: "APPROVE" | "REJECT"

    const attempt = await prisma.screeningAttempt.findUnique({
      where: { id: attemptId },
      include: { user: true },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const status = action === "APPROVE" ? "PASSED" : "FAILED";

    await prisma.screeningAttempt.update({
      where: { id: attemptId },
      data: {
        status,
        reviewNotes: reviewNotes || null,
        reviewedBy: user.username,
      },
    });

    // Update user status
    const isVerifiedNow = status === "PASSED" && attempt.user.idCardStatus === "APPROVED";
    await prisma.user.update({
      where: { id: attempt.userId },
      data: {
        screeningStatus: status,
        isVerified: isVerifiedNow,
      },
    });

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
