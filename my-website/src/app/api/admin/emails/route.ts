import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendNotificationEmail, EmailEventType } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET: list email logs
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isAdmin = user.roles.some((r) => r.role === "ADMIN");
    const isStaff = user.roles.some((r) => r.role === "STAFF");
    if (!isAdmin && !isStaff) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const logs = await prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Trigger manual email test / preview
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
    const { toEmail, toName, eventType, data } = body;

    const res = await sendNotificationEmail({
      recipient: { email: toEmail || user.email, name: toName || user.username },
      eventType: (eventType as EmailEventType) || "IDENTITY_APPROVED",
      data: data || {
        tripTitle: "กอดหมอกหน้าหนาว ดอยอินทนนท์ 3 วัน 2 คืน",
        amount: 1450,
        startDate: "5 ธ.ค. 2026",
        accName: "บ้านต้นไม้ แม่แจ่ม",
        province: "เชียงใหม่",
        checkIn: "5 ธ.ค. 2026",
        checkOut: "7 ธ.ค. 2026",
      },
    });

    return NextResponse.json(res);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
