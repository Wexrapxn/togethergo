import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: get reviews for members/drivers of this trip
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: tripId } = params;

    const ratings = await prisma.rating.findMany({
      where: { tripId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            profile: { select: { fullName: true, nickname: true } },
          },
        },
        target: {
          select: {
            id: true,
            username: true,
            profile: { select: { fullName: true, nickname: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, ratings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: submit rating for a fellow member or driver
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: tripId } = params;
    const body = await req.json();
    const { targetId, ratingType, score, comment } = body; // ratingType: "MEMBER" | "DRIVER"

    if (!targetId || !ratingType || !score) {
      return NextResponse.json({ error: "Missing required rating fields" }, { status: 400 });
    }

    if (targetId === user.id) {
      return NextResponse.json({ error: "Cannot rate yourself" }, { status: 400 });
    }

    const numScore = parseInt(score, 10);
    if (numScore < 1 || numScore > 5) {
      return NextResponse.json({ error: "Score must be between 1 and 5" }, { status: 400 });
    }

    // Check if user has already rated this target in this trip
    const existing = await prisma.rating.findFirst({
      where: {
        authorId: user.id,
        targetId,
        tripId,
        ratingType,
      },
    });

    if (existing) {
      // Update existing rating
      const updated = await prisma.rating.update({
        where: { id: existing.id },
        data: {
          score: numScore,
          comment: comment?.trim() || null,
        },
      });
      return NextResponse.json({ success: true, rating: updated });
    }

    const newRating = await prisma.rating.create({
      data: {
        authorId: user.id,
        targetId,
        tripId,
        ratingType,
        score: numScore,
        comment: comment?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, rating: newRating });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
