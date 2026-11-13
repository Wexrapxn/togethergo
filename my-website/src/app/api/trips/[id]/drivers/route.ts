import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET: Get driver applicants and votes for a trip
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: tripId } = params;

    const applications = await prisma.driverApplication.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profile: true,
            verificationDocuments: {
              where: { documentType: "DRIVING_LICENSE" },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const votes = await prisma.driverVote.findMany({
      where: { tripId },
    });

    // Compute average ratings for each applicant
    const appsWithRatings = await Promise.all(
      applications.map(async (app) => {
        const ratings = await prisma.rating.findMany({
          where: { targetId: app.userId, ratingType: "DRIVER" },
        });
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
            : null;

        const voteCount = votes.filter((v) => v.candidateId === app.userId).length;

        return {
          ...app,
          avgRating,
          ratingCount: ratings.length,
          voteCount,
        };
      })
    );

    return NextResponse.json({ success: true, applications: appsWithRatings, votes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Apply to be a driver
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tripId } = params;

    // Check if user has an approved driving license
    const approvedLicense = await prisma.verificationDocument.findFirst({
      where: {
        userId: user.id,
        documentType: "DRIVING_LICENSE",
        status: "APPROVED",
      },
    });

    if (!approvedLicense && !user.roles.some((r) => r.role === "ADMIN")) {
      return NextResponse.json(
        { error: "You must have an approved driving license to apply" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { vehicleInfo, licenseDocUrl } = body;

    // Check if already applied
    const existing = await prisma.driverApplication.findFirst({
      where: { tripId, userId: user.id },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Already applied for driver in this trip" },
        { status: 400 }
      );
    }

    const app = await prisma.driverApplication.create({
      data: {
        tripId,
        userId: user.id,
        vehicleInfo: vehicleInfo?.trim() || null,
        licenseDocUrl: licenseDocUrl || approvedLicense?.fileUrl || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, application: app });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
