import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: render raw HTML for an email log preview
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const log = await prisma.emailLog.findUnique({ where: { id } });

    if (!log) {
      return new NextResponse("Email log not found", { status: 404 });
    }

    return new NextResponse(log.bodyHtml, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
