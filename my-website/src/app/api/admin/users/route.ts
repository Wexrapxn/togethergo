import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = user.roles.some((r) => r.role === "ADMIN" || r.role === "STAFF");
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin or Staff role required" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        profile: true,
        roles: true,
        emergencyContacts: true,
        verificationDocuments: {
          orderBy: { createdAt: "desc" },
        },
        screeningAttempts: {
          orderBy: { attemptDate: "desc" },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Admin fetch users error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
