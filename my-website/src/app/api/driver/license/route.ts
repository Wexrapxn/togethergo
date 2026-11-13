import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST: Upload driving license
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { fileUrl } = body;

    if (!fileUrl) {
      return NextResponse.json({ error: "fileUrl required" }, { status: 400 });
    }

    // Check if already has a pending/approved license
    const existing = await prisma.verificationDocument.findFirst({
      where: {
        userId: user.id,
        documentType: "DRIVING_LICENSE",
        status: { in: ["PENDING", "APPROVED"] },
      },
    });

    if (existing) {
      return NextResponse.json({
        error: "You already have a license uploaded",
        document: existing,
      }, { status: 400 });
    }

    const doc = await prisma.verificationDocument.create({
      data: {
        userId: user.id,
        documentType: "DRIVING_LICENSE",
        fileUrl,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
