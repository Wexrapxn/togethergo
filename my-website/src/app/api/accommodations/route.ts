import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accommodations = await prisma.accommodation.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ accommodations });
  } catch (error: any) {
    console.error("Accommodations GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
