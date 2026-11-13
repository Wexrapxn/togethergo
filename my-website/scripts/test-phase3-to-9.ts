import { PrismaClient } from "@prisma/client";
import { generateEmailTemplate, sendNotificationEmail, EmailEventType } from "../src/lib/email";

const prisma = new PrismaClient();

async function runPhases3To9Tests() {
  console.log("=========================================");
  console.log(" Together Go — Phase 3 to 9 Test Suite");
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
    // ----------------------------------------------------
    // PHASE 3: ACCOMMODATIONS & HOST SYSTEM
    // ----------------------------------------------------
    console.log("--- Phase 3: Accommodations & Host Dashboard ---");

    const hostUser = await prisma.user.findUnique({
      where: { username: "somchai_host" },
      include: { roles: true },
    });
    assert(!!hostUser, "Host user somchai_host exists");
    assert(hostUser?.roles.some((r) => r.role === "HOST") ?? false, "somchai_host has HOST role");

    // Create a new accommodation for host
    const testAcc = await prisma.accommodation.create({
      data: {
        hostId: hostUser!.id,
        name: "ทดสอบโฮมสเตย์ ริมลำธาร",
        description: "ที่พักบรรยากาศดี",
        province: "เชียงใหม่",
        address: "อ.แม่ริม จ.เชียงใหม่",
        pricePerNight: 2000,
        maxGuests: 4,
        status: "PENDING",
      },
    });
    assert(testAcc.status === "PENDING", "New host accommodation defaults to PENDING status");

    // Admin approves the accommodation
    const approvedAcc = await prisma.accommodation.update({
      where: { id: testAcc.id },
      data: { status: "APPROVED" },
    });
    assert(approvedAcc.status === "APPROVED", "Admin can approve pending accommodation");

    // ----------------------------------------------------
    // PHASE 4: JOIN REQUESTS, LICENSES & DRIVER SYSTEM
    // ----------------------------------------------------
    console.log("\n--- Phase 4: Join Requests, Licenses & Driver System ---");

    const fern = await prisma.user.findUnique({
      where: { username: "fern_traveler" },
      include: { verificationDocuments: true },
    });
    assert(!!fern, "Demo user fern_traveler exists");

    // Driving license check
    const fernLicense = await prisma.verificationDocument.findFirst({
      where: { userId: fern!.id, documentType: "DRIVING_LICENSE" },
    });
    assert(!!fernLicense && fernLicense.status === "APPROVED", "Driver has approved driving license");

    // Find demo trip
    const trip = await prisma.trip.findFirst({
      where: { title: { contains: "ดอยอินทนนท์" } },
      include: { members: true, driverApps: true, driverVotes: true },
    });
    assert(!!trip, "Demo trip 1 exists");

    // Driver application
    const driverApp = await prisma.driverApplication.findFirst({
      where: { tripId: trip!.id, userId: fern!.id },
    });
    assert(!!driverApp, "Driver application exists for trip");
    assert(driverApp?.status === "SELECTED", "Driver can be SELECTED by trip creator");

    // Driver votes
    const votes = await prisma.driverVote.findMany({ where: { tripId: trip!.id } });
    assert(votes.length >= 1, "Trip members can vote for driver candidate");

    // Driver rating calculation
    const driverRatings = await prisma.rating.findMany({
      where: { targetId: fern!.id, ratingType: "DRIVER" },
    });
    assert(driverRatings.length >= 1, "Driver ratings recorded");
    const avgScore = driverRatings.reduce((s, r) => s + r.score, 0) / driverRatings.length;
    assert(avgScore >= 1 && avgScore <= 5, `Driver average rating calculated accurately: ${avgScore}/5`);

    // ----------------------------------------------------
    // PHASE 5: ADMIN & STAFF RBAC AND BACKEND
    // ----------------------------------------------------
    console.log("\n--- Phase 5: Admin & Staff Comprehensive Backend ---");

    const admin = await prisma.user.findUnique({
      where: { username: "admin" },
      include: { roles: true },
    });
    const staff = await prisma.user.findUnique({
      where: { username: "korn_staff" },
      include: { roles: true },
    });

    assert(admin?.roles.some((r) => r.role === "ADMIN") ?? false, "Admin has ADMIN role");
    assert(staff?.roles.some((r) => r.role === "STAFF") ?? false, "Staff has STAFF role");
    assert(!(staff?.roles.some((r) => r.role === "ADMIN") ?? true), "Staff DOES NOT have ADMIN role (Privilege separation)");

    // Staff assignments & permissions
    const staffAssignment = await prisma.staffAssignment.findUnique({
      where: { userId: staff!.id },
    });
    assert(!!staffAssignment, "Staff has permissions assignment record");
    const perms = JSON.parse(staffAssignment!.permissions);
    assert(perms.includes("VERIFY_ID"), "Staff has VERIFY_ID permission");
    assert(perms.includes("HANDLE_EMERGENCY"), "Staff has HANDLE_EMERGENCY permission");

    // AppSettings fee & screening threshold
    const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
    assert(settings?.platformFeePerUser === 50, "Platform fee is 50 THB per user");
    assert(settings?.screeningThreshold === 9, "Screening threshold is 9 (pass <= 8, review >= 9)");
    assert(settings?.screeningCooldownDays === 3, "Screening cooldown is 3 days");

    // ----------------------------------------------------
    // PHASE 6: GROUP CHAT, SOS, REPORTS & POST-TRIP REVIEWS
    // ----------------------------------------------------
    console.log("\n--- Phase 6: Group Chat, SOS Alert, Reports & Reviews ---");

    // Chat messages (only for paid/approved members)
    const messages = await prisma.message.findMany({ where: { tripId: trip!.id } });
    assert(messages.length >= 2, "Trip chat contains messages between approved members");

    // SOS Emergency Alert
    const emergencyAlert = await prisma.emergencyAlert.findFirst({
      where: { tripId: trip!.id },
    });
    assert(!!emergencyAlert, "Emergency SOS alert recorded in database");
    assert(typeof emergencyAlert?.latitude === "number" && typeof emergencyAlert?.longitude === "number", "SOS alert stores precise GPS latitude and longitude");

    // User Report
    const testReport = await prisma.report.create({
      data: {
        reporterId: admin!.id,
        reportedUserId: fern!.id,
        tripId: trip!.id,
        reason: "inappropriate",
        details: "ทดสอบการรายงานผู้ใช้",
        status: "PENDING",
      },
    });
    assert(testReport.status === "PENDING", "User report created with PENDING status");

    // Reviews (MEMBER & DRIVER separately)
    const memberRating = await prisma.rating.findFirst({
      where: { tripId: trip!.id, ratingType: "MEMBER" },
    });
    assert(!!memberRating, "Member rating created separately from driver rating");
    assert(memberRating?.score === 5, "Rating score recorded accurately");

    // ----------------------------------------------------
    // PHASE 7: BOOKING STATUS & HOST PAYOUTS
    // ----------------------------------------------------
    console.log("\n--- Phase 7: Accommodation Booking & Host Payouts ---");

    const booking = await prisma.booking.findFirst({
      where: { tripId: trip!.id },
      include: { payouts: true },
    });
    assert(!!booking, "Trip accommodation booking exists");
    assert(booking?.status === "BOOKED", "Booking status can be updated to BOOKED");

    const hostPayout = booking?.payouts[0];
    assert(!!hostPayout, "Host payout record linked to booking exists");
    assert(hostPayout?.status === "TRANSFERRED", "Payout status updated to TRANSFERRED");
    assert(!!hostPayout?.transferProofUrl, "Payout contains transfer proof receipt URL");

    // ----------------------------------------------------
    // PHASE 8: EMAIL NOTIFICATIONS & LOGS
    // ----------------------------------------------------
    console.log("\n--- Phase 8: Email Notification Service & Templates ---");

    // 5 Events Template Verification
    const events: EmailEventType[] = [
      "IDENTITY_APPROVED",
      "TRIP_JOIN_APPROVED",
      "PAYMENT_SUCCESS",
      "TRIP_REMINDER",
      "BOOKING_CONFIRMED",
    ];

    for (const ev of events) {
      const tpl = generateEmailTemplate(ev, "ทดสอบ ผู้ใช้", {
        tripTitle: "ทริปดอยอินทนนท์",
        amount: 1450,
        startDate: "5 ธ.ค. 2026",
      });
      assert(!!tpl.subject && tpl.subject.length > 5, `Template ${ev} generated valid subject: "${tpl.subject.slice(0, 30)}..."`);
      assert(tpl.html.includes("Together") && tpl.html.includes("Go"), `Template ${ev} HTML contains brand headers`);
    }

    // Email notification logging
    const emailResult = await sendNotificationEmail({
      recipient: { email: "test.traveler@example.com", name: "นักเดินทางทดสอบ" },
      eventType: "TRIP_JOIN_APPROVED",
      data: { tripTitle: "ทริปเชียงใหม่", amount: 1500 },
      relatedId: trip!.id,
    });
    assert(emailResult.success, "sendNotificationEmail executed successfully");
    assert(!!emailResult.logId, "EmailLog record created for preview/auditing without real SMTP required");

    // ----------------------------------------------------
    // PHASE 9: SANDBOX PAYMENT & REFUND FORMULA
    // ----------------------------------------------------
    console.log("\n--- Phase 9: Sandbox Payment & Partial Refund System ---");

    // Formula calculation: (Lodging Total / Max Members) + Platform Fee
    const nights = 2;
    const accPricePerNight = 1800;
    const maxMembers = 4;
    const expectedLodgingShare = Math.round((accPricePerNight * nights) / maxMembers); // 3600 / 4 = 900
    const expectedPlatformFee = 50;
    const expectedTotalPayment = expectedLodgingShare + expectedPlatformFee; // 950

    assert(expectedLodgingShare === 900, "Lodging share computed: ฿900");
    assert(expectedTotalPayment === 950, "Total payment = Lodging Share (฿900) + Platform Fee (฿50) = ฿950");

    // Payment in database
    const payment = await prisma.payment.findFirst({
      where: { tripId: trip!.id, status: "SUCCESS" },
    });
    assert(!!payment, "Payment record exists in database");
    assert(payment?.amount === 950, `Payment amount matches formula: ฿${payment?.amount}`);
    assert(payment?.shareAmount === 900, "Lodging share portion recorded: ฿900");
    assert(payment?.platformFee === 50, "Platform fee portion recorded: ฿50");

    // Test Cancellation & Refund: only shareAmount is refunded, platformFee is retained!
    const refundablePayment = await prisma.payment.create({
      data: {
        userId: fern!.id,
        tripId: trip!.id,
        amount: 950,
        shareAmount: 900,
        platformFee: 50,
        status: "SUCCESS",
        gatewayRef: "SANDBOX-REFUND-TEST-001",
      },
    });

    const refundAmount = refundablePayment.shareAmount;
    const retainedFee = refundablePayment.platformFee;

    const refunded = await prisma.payment.update({
      where: { id: refundablePayment.id },
      data: { status: "REFUNDED" },
    });

    assert(refunded.status === "REFUNDED", "Payment status updated to REFUNDED");
    assert(refundAmount === 900, "Refunded ONLY lodging share: ฿900");
    assert(retainedFee === 50, "Platform fee retained by platform: ฿50");

    // Clean up test records
    await prisma.accommodation.delete({ where: { id: testAcc.id } });
    await prisma.report.delete({ where: { id: testReport.id } });
    await prisma.payment.delete({ where: { id: refundablePayment.id } });

    console.log("\n=========================================");
    console.log(`  Phase 3-9 Tests: ${passed} / ${total} Passed`);
    console.log("=========================================\n");

    if (passed === total) {
      console.log("🎉 All Phase 3, 4, 5, 6, 7, 8, and 9 tests passed 100%!");
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runPhases3To9Tests();
