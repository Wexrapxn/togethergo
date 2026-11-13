import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const province = searchParams.get("province")?.trim();
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const priceRange = searchParams.get("price"); // "low", "med", "high", "all"

    const where: any = {
      status: { not: "CANCELLED" },
    };

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { province: { contains: search } },
      ];
    }

    if (province && province !== "all") {
      where.province = { contains: province };
    }

    if (startDateParam) {
      where.startDate = { gte: new Date(startDateParam) };
    }

    if (endDateParam) {
      where.endDate = { lte: new Date(endDateParam) };
    }

    const trips = await prisma.trip.findMany({
      where,
      orderBy: { startDate: "asc" },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            isVerified: true,
            screeningStatus: true,
            profile: true,
          },
        },
        accommodation: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isVerified: true,
                screeningStatus: true,
                profile: true,
              },
            },
          },
        },
        roles: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profile: true,
              },
            },
          },
        },
      },
    });

    // Compute cost calculations for each trip
    const tripsWithCost = trips.map((t) => {
      const nights = Math.max(
        1,
        Math.round((new Date(t.endDate).getTime() - new Date(t.startDate).getTime()) / (1000 * 60 * 60 * 24))
      );
      const accPrice = t.accommodation?.pricePerNight || 0;
      const accPerPerson = Math.round((accPrice * nights) / t.maxMembers);
      const fuelTotal = t.totalFuelDistance * t.fuelPricePerLiter;
      const fuelPerPerson = Math.round(fuelTotal / t.maxMembers);
      const platformFee = 50;
      const totalEstimatedCost = accPerPerson + fuelPerPerson + platformFee;

      const approvedMembersCount = t.members.filter((m) => m.status === "APPROVED" || m.status === "PAID").length;
      const seatsLeft = Math.max(0, t.maxMembers - approvedMembersCount);

      return {
        ...t,
        nights,
        days: nights + 1,
        costBreakdown: {
          accPerPerson,
          fuelPerPerson,
          platformFee,
          totalEstimatedCost,
        },
        approvedMembersCount,
        seatsLeft,
      };
    });

    // Apply price filter in memory after cost calculation
    let filteredTrips = tripsWithCost;
    if (priceRange === "low") {
      filteredTrips = tripsWithCost.filter((t) => t.costBreakdown.totalEstimatedCost <= 1500);
    } else if (priceRange === "med") {
      filteredTrips = tripsWithCost.filter(
        (t) => t.costBreakdown.totalEstimatedCost > 1500 && t.costBreakdown.totalEstimatedCost <= 3500
      );
    } else if (priceRange === "high") {
      filteredTrips = tripsWithCost.filter((t) => t.costBreakdown.totalEstimatedCost > 3500);
    }

    return NextResponse.json({
      success: true,
      trips: filteredTrips,
      total: filteredTrips.length,
    });
  } catch (error: any) {
    console.error("Trips GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch trips" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in first." }, { status: 401 });
    }

    // Check verification status: must be verified or admin/staff
    const isAdmin = user.roles.some((r) => r.role === "ADMIN" || r.role === "STAFF");
    if (!isAdmin && (!user.isVerified || user.screeningStatus !== "PASSED")) {
      return NextResponse.json(
        {
          error: "You must complete ID verification and pass the safety screening before creating a trip.",
          requireVerification: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      province,
      description,
      startDate,
      endDate,
      maxMembers,
      coverImage,
      accommodationId,
      totalFuelDistance,
      fuelPricePerLiter,
    } = body;

    if (!title || !province || !description || !startDate || !endDate || !maxMembers) {
      return NextResponse.json({ error: "Please provide all required trip fields" }, { status: 400 });
    }

    const numMembers = parseInt(maxMembers, 10);
    const distanceKm = parseFloat(totalFuelDistance || "0");
    const fuelPrice = parseFloat(fuelPricePerLiter || "36.5");
    const estimatedFuelCost = distanceKm * fuelPrice;

    // Default image if not provided
    const finalCover =
      coverImage?.trim() ||
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

    const newTrip = await prisma.trip.create({
      data: {
        creatorId: user.id,
        title: title.trim(),
        province: province.trim(),
        description: description.trim(),
        coverImage: finalCover,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxMembers: numMembers,
        totalFuelDistance: distanceKm,
        fuelPricePerLiter: fuelPrice,
        estimatedFuelCost,
        accommodationId: accommodationId || null,
        status: "OPEN",
        // Creator automatically joins as approved member
        members: {
          create: [{ userId: user.id, status: "APPROVED" }],
        },
        // Setup 4 default essential roles
        roles: {
          create: [
            {
              roleName: "ไกด์นำทาง",
              description: "ช่วยนำทาง ศึกษาเส้นทาง และจุดเช็คอินของทริป",
              userId: user.id, // creator claims guide by default
            },
            {
              roleName: "ดูแลที่พัก",
              description: "ประสานงานเรื่องกุญแจ การเช็คอิน-เช็คเอาท์ และความเรียบร้อยของห้องพัก",
            },
            {
              roleName: "จัดหาเสบียง/ร้านอาหาร",
              description: "เลือกร้านอาหารเด็ด เตรียมเครื่องดื่ม ขนม และของใช้ส่วนกลาง",
            },
            {
              roleName: "คนขับรถ",
              description: "รับผิดชอบการขับขี่อย่างปลอดภัย พักผ่อนเพียงพอ (ต้องมีใบขับขี่)",
            },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      tripId: newTrip.id,
    });
  } catch (error: any) {
    console.error("Trip create error:", error);
    return NextResponse.json({ error: error.message || "Failed to create trip" }, { status: 500 });
  }
}
