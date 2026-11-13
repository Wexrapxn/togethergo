import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Fetch messages for a trip (PAID or APPROVED members, or admin/staff)
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: tripId } = params;

    // Check membership or admin/staff
    const isAdmin = user.roles.some((r) => r.role === "ADMIN" || r.role === "STAFF");
    const membership = await prisma.tripMember.findFirst({
      where: {
        tripId,
        userId: user.id,
        status: { in: ["APPROVED", "PAID"] },
      },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { error: "Must be a paid or approved trip member to view chat" },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { fullName: true, nickname: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ success: true, messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Send new message in trip chat
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: tripId } = params;

    // Check membership (PAID or APPROVED)
    const isAdmin = user.roles.some((r) => r.role === "ADMIN" || r.role === "STAFF");
    const membership = await prisma.tripMember.findFirst({
      where: {
        tripId,
        userId: user.id,
        status: { in: ["APPROVED", "PAID"] },
      },
    });

    if (!isAdmin && !membership) {
      return NextResponse.json(
        { error: "Only approved or paid members can send chat messages" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content, imageUrl } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const newMessage = await prisma.message.create({
      data: {
        tripId,
        userId: user.id,
        content: content.trim(),
        imageUrl: imageUrl || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: {
              select: { fullName: true, nickname: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, message: newMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
