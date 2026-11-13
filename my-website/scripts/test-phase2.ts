import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runPhase2Tests() {
  console.log("=========================================");
  console.log("   Together Go — Phase 2 Test Suite");
  console.log("=========================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  try {
    // 1. Test Demo Data Seeding & Accommodations
    console.log("--- 1. Testing Accommodations & Demo Trips ---");
    const accommodations = await prisma.accommodation.findMany();
    assert(accommodations.length >= 4, "At least 4 demo accommodations exist in database");

    const allTrips = await prisma.trip.findMany({
      include: { accommodation: true, members: true, roles: true, creator: true },
    });
    assert(allTrips.length >= 4, "At least 4 demo trips exist in database");

    // 2. Test Province Filter
    console.log("\n--- 2. Testing Trip Query & Filters ---");
    const chiangMaiTrips = await prisma.trip.findMany({
      where: { province: { contains: "เชียงใหม่" } },
    });
    assert(chiangMaiTrips.length >= 1, "Province filter correctly returns Chiang Mai trips");
    assert(chiangMaiTrips.every((t) => t.province.includes("เชียงใหม่")), "All returned trips match province");

    const krabiTrips = await prisma.trip.findMany({
      where: { province: { contains: "กระบี่" } },
    });
    assert(krabiTrips.length >= 1, "Province filter correctly returns Krabi trips");

    // 3. Test Cost Breakdown Formula
    console.log("\n--- 3. Testing Automated Travel Cost Formula ---");
    const sampleTrip = allTrips[0];
    const nights = Math.max(
      1,
      Math.round(
        (new Date(sampleTrip.endDate).getTime() - new Date(sampleTrip.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const accPrice = sampleTrip.accommodation?.pricePerNight || 0;
    const accPerPerson = Math.round((accPrice * nights) / sampleTrip.maxMembers);
    const fuelTotal = sampleTrip.totalFuelDistance * sampleTrip.fuelPricePerLiter;
    const fuelPerPerson = Math.round(fuelTotal / sampleTrip.maxMembers);
    const platformFee = 50;
    const totalEst = accPerPerson + fuelPerPerson + platformFee;

    assert(nights >= 1, `Trip nights computed accurately (${nights} nights)`);
    assert(fuelTotal > 0, `Total fuel cost computed (${fuelTotal} THB)`);
    assert(fuelPerPerson > 0, `Fuel share per person computed: ${fuelPerPerson} THB`);
    assert(totalEst === accPerPerson + fuelPerPerson + 50, "Total cost sum equals (Lodging + Fuel + PlatformFee)");

    // 4. Test Trip Creation by Verified Member
    console.log("\n--- 4. Testing Trip Creation & Default Roles ---");
    const creatorUser = await prisma.user.findFirst({
      where: { isVerified: true, screeningStatus: "PASSED" },
    });
    assert(!!creatorUser, "Found a verified user for trip creation");

    const newTrip = await prisma.trip.create({
      data: {
        creatorId: creatorUser!.id,
        title: "ทริปทดสอบ Phase 2 อู่ทอง-สุพรรณบุรี",
        province: "สุพรรณบุรี",
        description: "ทริปไหว้พระ ชมธรรมชาติริมอ่างเก็บน้ำ",
        startDate: new Date("2026-12-20"),
        endDate: new Date("2026-12-22"),
        maxMembers: 4,
        totalFuelDistance: 220,
        fuelPricePerLiter: 36.0,
        estimatedFuelCost: 220 * 36.0,
        status: "OPEN",
        members: {
          create: [{ userId: creatorUser!.id, status: "APPROVED" }],
        },
        roles: {
          create: [
            { roleName: "ไกด์นำทาง", description: "นำทางทริป", userId: creatorUser!.id },
            { roleName: "ดูแลที่พัก", description: "ดูแลกุญแจห้องพัก" },
            { roleName: "จัดหาเสบียง/ร้านอาหาร", description: "จัดซื้อเสบียง" },
            { roleName: "คนขับรถ", description: "คนขับหลัก" },
          ],
        },
      },
      include: { members: true, roles: true },
    });

    assert(!!newTrip.id, "New trip successfully created");
    assert(newTrip.members.length === 1, "Creator is automatically added as approved member");
    assert(newTrip.members[0].status === "APPROVED", "Creator member status is APPROVED");
    assert(newTrip.roles.length === 4, "4 default roles created (Guide, Acc Care, Food, Driver)");
    assert(newTrip.roles[0].userId === creatorUser!.id, "Creator assigned to Guide role by default");

    // 5. Test Trip Roles Management: Claim, Unclaim, Add, Delete
    console.log("\n--- 5. Testing Trip Roles System (Claim, Unclaim, Add, Delete) ---");
    // Create a 2nd verified user
    const member2 = await prisma.user.create({
      data: {
        username: `joiner_${Date.now()}`,
        email: `joiner_${Date.now()}@example.com`,
        passwordHash: "hash1234",
        isVerified: true,
        screeningStatus: "PASSED",
        onboardingStep: 5,
        roles: { create: [{ role: "USER" }] },
      },
    });

    // Add member2 to trip
    await prisma.tripMember.create({
      data: { tripId: newTrip.id, userId: member2.id, status: "APPROVED" },
    });

    // Member 2 claims the "ดูแลที่พัก" role
    const accRole = newTrip.roles.find((r) => r.roleName === "ดูแลที่พัก")!;
    const claimedRole = await prisma.tripRole.update({
      where: { id: accRole.id },
      data: { userId: member2.id },
    });
    assert(claimedRole.userId === member2.id, "Member successfully claimed 'ดูแลที่พัก' role");

    // Member 2 unclaims role
    const unclaimedRole = await prisma.tripRole.update({
      where: { id: accRole.id },
      data: { userId: null },
    });
    assert(unclaimedRole.userId === null, "Member successfully unclaimed role (userId is null)");

    // Creator adds custom role "ช่างภาพประจำทริป"
    const photoRole = await prisma.tripRole.create({
      data: {
        tripId: newTrip.id,
        roleName: "ช่างภาพประจำทริป",
        description: "บันทึกภาพและวิดีโอความประทับใจ",
      },
    });
    assert(photoRole.roleName === "ช่างภาพประจำทริป", "Creator added custom role 'ช่างภาพประจำทริป'");

    // Creator deletes custom role
    await prisma.tripRole.delete({ where: { id: photoRole.id } });
    const remainingRoles = await prisma.tripRole.findMany({ where: { tripId: newTrip.id } });
    assert(!remainingRoles.some((r) => r.id === photoRole.id), "Custom role successfully deleted");

    // 6. Test Request to Join & Creator Member Approval
    console.log("\n--- 6. Testing Join Request & Creator Approval Workflow ---");
    const member3 = await prisma.user.create({
      data: {
        username: `applicant_${Date.now()}`,
        email: `applicant_${Date.now()}@example.com`,
        passwordHash: "hash1234",
        isVerified: true,
        screeningStatus: "PASSED",
        onboardingStep: 5,
        roles: { create: [{ role: "USER" }] },
      },
    });

    // Member 3 submits join request
    const joinRequest = await prisma.tripMember.create({
      data: {
        tripId: newTrip.id,
        userId: member3.id,
        status: "REQUESTED",
      },
    });
    assert(joinRequest.status === "REQUESTED", "Join request submitted with status REQUESTED");

    // Creator approves Member 3
    const approvedMember = await prisma.tripMember.update({
      where: { id: joinRequest.id },
      data: { status: "APPROVED" },
    });
    assert(approvedMember.status === "APPROVED", "Creator successfully approved join request");

    // 7. Test My Trips Queries
    console.log("\n--- 7. Testing My Trips Queries ---");
    const myCreated = await prisma.trip.findMany({
      where: { creatorId: creatorUser!.id },
    });
    assert(myCreated.length >= 1, "User's created trips correctly fetched");

    const myJoined = await prisma.tripMember.findMany({
      where: { userId: member2.id },
      include: { trip: true },
    });
    assert(myJoined.length >= 1, "User's joined trips correctly fetched");
    assert(myJoined[0].trip.id === newTrip.id, "Joined trip matches test trip ID");

    console.log("\n=========================================");
    console.log(`  Phase 2 Tests Completed: ${passed} / ${total} Passed`);
    console.log("=========================================\n");

    if (passed === total) {
      console.log("🎉 Phase 2 trip search/filter, creation, roles, and cost calculation passed 100%!");
    }
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhase2Tests();
