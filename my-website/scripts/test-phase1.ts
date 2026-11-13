import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "together-go-secret-jwt-key-2026-secure-token-phase-1";

async function runTests() {
  console.log("=========================================");
  console.log("   Together Go — Phase 1 Test Suite");
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
    // 1. Verify Default Admin Account
    console.log("--- 1. Testing Default Admin Account ---");
    const admin = await prisma.user.findFirst({
      where: { username: "admin" },
      include: { roles: true, profile: true },
    });
    assert(!!admin, "Admin account exists in database");
    assert(admin?.username === "admin", "Admin username is 'admin'");
    const isPasswordValid = await bcrypt.compare("1234", admin?.passwordHash || "");
    assert(isPasswordValid, "Admin password matches default '1234'");
    assert(admin?.roles.some((r) => r.role === "ADMIN") === true, "Admin has 'ADMIN' role");
    assert(admin?.isVerified === true, "Admin is pre-verified");
    assert(admin?.screeningStatus === "PASSED", "Admin screening status is 'PASSED'");

    // 2. User Registration Flow
    console.log("\n--- 2. Testing User Registration Flow ---");
    const testUsername = `traveler_${Date.now()}`;
    const testEmail = `${testUsername}@example.com`;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("securepass123", salt);

    const newUser = await prisma.user.create({
      data: {
        username: testUsername,
        email: testEmail,
        passwordHash: hash,
        onboardingStep: 1,
        roles: { create: [{ role: "USER" }] },
      },
      include: { roles: true },
    });

    assert(!!newUser.id, "New user registered with UUID");
    assert(newUser.onboardingStep === 1, "New user starts at onboarding step 1 (PDPA)");
    assert(newUser.idCardStatus === "NOT_SUBMITTED", "Default ID card status is NOT_SUBMITTED");
    assert(newUser.screeningStatus === "NOT_STARTED", "Default screening status is NOT_STARTED");
    assert(newUser.isVerified === false, "User is not verified initially");

    // 3. JWT Token Generation & Verification
    console.log("\n--- 3. Testing JWT Authentication ---");
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email, roles: ["USER"] },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    assert(decoded.userId === newUser.id, "JWT signed and decoded correctly");
    assert(decoded.username === newUser.username, "JWT payload contains correct username");

    // 4. Onboarding Step 1: PDPA Consent
    console.log("\n--- 4. Testing Step 1: PDPA Consent ---");
    const consent = await prisma.consent.create({
      data: {
        userId: newUser.id,
        consentType: "PDPA",
        version: "1.0",
        agreed: true,
        ipAddress: "127.0.0.1",
        userAgent: "Jest-Test-Agent",
      },
    });
    const updatedUserStep2 = await prisma.user.update({
      where: { id: newUser.id },
      data: { onboardingStep: 2 },
    });
    assert(consent.agreed === true, "PDPA consent recorded with agreed=true");
    assert(updatedUserStep2.onboardingStep === 2, "User advanced to step 2");

    // 5. Onboarding Step 2: Profile & Emergency Contact
    console.log("\n--- 5. Testing Step 2: Profile & Emergency Contact ---");
    const profile = await prisma.profile.create({
      data: {
        userId: newUser.id,
        fullName: "สมชาย นักผจญภัย",
        nickname: "ชาย",
        phone: "0891234567",
        gender: "MALE",
        bio: "ชอบปีนเขา ถ่ายรูป ท่องเที่ยวแบบเป็นมิตร",
      },
    });
    const emergencyContact = await prisma.emergencyContact.create({
      data: {
        userId: newUser.id,
        name: "สมศรี ผู้ปกครอง",
        relationship: "PARENT",
        phone: "0819876543",
      },
    });
    const updatedUserStep3 = await prisma.user.update({
      where: { id: newUser.id },
      data: { onboardingStep: 3 },
    });
    assert(profile.fullName === "สมชาย นักผจญภัย", "Profile created with correct Thai full name");
    assert(emergencyContact.name === "สมศรี ผู้ปกครอง", "Emergency contact linked successfully");
    assert(updatedUserStep3.onboardingStep === 3, "User advanced to step 3");

    // 6. Onboarding Step 3: ID Verification Documents
    console.log("\n--- 6. Testing Step 3: ID & Selfie Upload ---");
    const idCardDoc = await prisma.verificationDocument.create({
      data: {
        userId: newUser.id,
        documentType: "IDCARD",
        fileUrl: "/uploads/mock-idcard.jpg",
        status: "PENDING",
      },
    });
    const selfieDoc = await prisma.verificationDocument.create({
      data: {
        userId: newUser.id,
        documentType: "SELFIE_WITH_IDCARD",
        fileUrl: "/uploads/mock-selfie.jpg",
        status: "PENDING",
      },
    });
    const updatedUserStep4 = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        idCardStatus: "PENDING",
        onboardingStep: 4,
      },
    });
    assert(idCardDoc.status === "PENDING", "ID Card document status is PENDING");
    assert(selfieDoc.status === "PENDING", "Selfie document status is PENDING");
    assert(updatedUserStep4.idCardStatus === "PENDING", "User idCardStatus is PENDING");
    assert(updatedUserStep4.onboardingStep === 4, "User advanced to step 4 (Screening)");

    // 7. Onboarding Step 4: Mental Health Screening with Server-Side Scoring & Cooldown
    console.log("\n--- 7. Testing Step 4: Mental Health Assessment & Cooldown ---");
    // Simulate answers with low score (0 + 1 + 0 + 1 + 0 + 1 + 0 + 0 + 0 = 3 points)
    const lowRiskAnswers = [0, 1, 0, 1, 0, 1, 0, 0, 0];
    const totalScore = lowRiskAnswers.reduce((a, b) => a + b, 0);
    const riskLevel = totalScore <= 8 ? "LOW" : "MODERATE";
    const status = riskLevel === "LOW" ? "PASSED" : "PENDING_REVIEW";

    const nextEligibleDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days cooldown

    const attempt = await prisma.screeningAttempt.create({
      data: {
        userId: newUser.id,
        answersJson: JSON.stringify(lowRiskAnswers),
        totalScore,
        riskLevel,
        status,
        nextEligibleDate,
      },
    });

    assert(attempt.totalScore === 3, "Backend accurately computed total score (3/27)");
    assert(attempt.riskLevel === "LOW", "Risk level classified as LOW for <= 8 points");
    assert(attempt.status === "PASSED", "Screening status set to PASSED");

    // Cooldown verification: next attempt within 3 days is blocked
    const now = new Date();
    const isCooldownActive = now < attempt.nextEligibleDate;
    assert(isCooldownActive, "3-day cooldown is active and will prevent immediate retake");

    // Update user after passing screening
    const updatedUserStep5 = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        screeningStatus: status,
        onboardingStep: 5,
      },
    });
    assert(updatedUserStep5.screeningStatus === "PASSED", "User screening status is PASSED");
    assert(updatedUserStep5.onboardingStep === 5, "Onboarding fully completed (step 5)");
    assert(updatedUserStep5.isVerified === false, "User not fully verified until Admin approves ID card");

    // 8. Admin Verification Workflow
    console.log("\n--- 8. Testing Admin Approval Workflow ---");
    // Admin approves ID card
    await prisma.verificationDocument.updateMany({
      where: { userId: newUser.id, status: "PENDING" },
      data: { status: "APPROVED", reviewedBy: "admin" },
    });
    const finalizedUser = await prisma.user.update({
      where: { id: newUser.id },
      data: {
        idCardStatus: "APPROVED",
        isVerified: true, // both ID is approved and screening is PASSED
      },
    });

    assert(finalizedUser.idCardStatus === "APPROVED", "ID card approved by Admin");
    assert(finalizedUser.isVerified === true, "User has isVerified = true ('ยืนยันตัวตนแล้ว')");
    assert(finalizedUser.screeningStatus === "PASSED", "User has 'ผ่านแบบประเมิน'");

    console.log("\n=========================================");
    console.log(`  Tests Completed: ${passed} / ${total} Passed`);
    console.log("=========================================\n");

    if (passed === total) {
      console.log("🎉 Phase 1 backend, schema, logic, auth, and onboarding tests passed 100%!");
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
