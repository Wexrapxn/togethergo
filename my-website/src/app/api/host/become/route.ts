import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if already HOST
    const alreadyHost = user.roles.some((r) => r.role === "HOST");
    if (alreadyHost) {
      return NextResponse.json({ success: true, message: "Already a host" });
    }

    // Add HOST role
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: "HOST",
      },
    });

    return NextResponse.json({ success: true, message: "Host role granted" });
  } catch (error: any) {
    console.error("Become host error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
