import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateEmailTemplate } from "../src/lib/email";

const prisma = new PrismaClient();

export async function seedDefaultAdminAndSettings() {
  // Ensure AppSettings (Phase 5, 8, 9)
  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformFeePerUser: 50.0,
      screeningThreshold: 9,
      screeningCooldownDays: 3,
      emailSenderDomain: "noreply@togethergo.com",
    },
  });

  // Ensure Admin User
  let admin = await prisma.user.findFirst({
    where: {
      OR: [{ username: "admin" }, { email: "admin@togethergo.com" }],
    },
    include: { profile: true },
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("1234", salt);

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@togethergo.com",
        passwordHash,
        isVerified: true,
        idCardStatus: "APPROVED",
        screeningStatus: "PASSED",
        onboardingStep: 5,
        roles: {
          create: [{ role: "ADMIN" }, { role: "STAFF" }, { role: "USER" }, { role: "HOST" }],
        },
        profile: {
          create: {
            fullName: "ผู้ดูแลระบบ Together Go",
            nickname: "Admin",
            phone: "0812345678",
            bio: "บัญชีผู้ดูแลระบบหลักของ Together Go",
          },
        },
        emergencyContacts: {
          create: {
            name: "ศูนย์ความปลอดภัย Together Go",
            relationship: "ผู้ดูแลระบบ",
            phone: "021234567",
          },
        },
      },
      include: { profile: true },
    });
    console.log("Default Admin created: username: admin, password: 1234");
  }

  return admin;
}

export async function seedDemoAccommodationsAndTrips() {
  const admin = await seedDefaultAdminAndSettings();
  const salt = await bcrypt.genSalt(10);
  const commonPassword = await bcrypt.hash("1234", salt);

  // 1. Create or get verified traveler (Fern)
  let fern = await prisma.user.findUnique({
    where: { username: "fern_traveler" },
  });

  if (!fern) {
    fern = await prisma.user.create({
      data: {
        username: "fern_traveler",
        email: "fern@togethergo.com",
        passwordHash: commonPassword,
        isVerified: true,
        idCardStatus: "APPROVED",
        screeningStatus: "PASSED",
        onboardingStep: 5,
        roles: { create: [{ role: "USER" }] },
        profile: {
          create: {
            fullName: "พิมพ์มาดา รัตนกุล",
            nickname: "ใบเฟิร์น",
            phone: "0895551234",
            gender: "FEMALE",
            bio: "รักการเดินทาง ชอบเดินป่า ถ่ายรูปกล้องฟิล์ม ชิลๆ เป็นกันเองมากค่ะ",
          },
        },
        emergencyContacts: {
          create: {
            name: "คุณแม่พรพิมล",
            relationship: "PARENT",
            phone: "0812223344",
          },
        },
      },
    });
    console.log("Demo verified traveler created: fern_traveler");
  }

  // Ensure fern has approved driving license (Phase 4)
  const existingLicense = await prisma.verificationDocument.findFirst({
    where: { userId: fern.id, documentType: "DRIVING_LICENSE" },
  });
  if (!existingLicense) {
    await prisma.verificationDocument.create({
      data: {
        userId: fern.id,
        documentType: "DRIVING_LICENSE",
        fileUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80",
        status: "APPROVED",
      },
    });
  }

  // 2. Create Demo Host User (Somchai) - Phase 3
  let hostSomchai = await prisma.user.findUnique({
    where: { username: "somchai_host" },
  });

  if (!hostSomchai) {
    hostSomchai = await prisma.user.create({
      data: {
        username: "somchai_host",
        email: "host.somchai@togethergo.com",
        passwordHash: commonPassword,
        isVerified: true,
        idCardStatus: "APPROVED",
        screeningStatus: "PASSED",
        onboardingStep: 5,
        roles: { create: [{ role: "HOST" }, { role: "USER" }] },
        profile: {
          create: {
            fullName: "สมชาย วงศ์สว่าง",
            nickname: "น้าชาย",
            phone: "0861112233",
            bio: "เจ้าของโฮมสเตย์และที่พักธรรมชาติ ยินดีต้อนรับนักเดินทางทุกท่านครับ",
          },
        },
        emergencyContacts: {
          create: {
            name: "ป้าเพ็ญ วงศ์สว่าง",
            relationship: "SPOUSE",
            phone: "0864445566",
          },
        },
      },
    });
    console.log("Demo Host created: somchai_host");
  }

  // 3. Create Demo Staff User - Phase 5
  let staffKorn = await prisma.user.findUnique({
    where: { username: "korn_staff" },
  });

  if (!staffKorn) {
    staffKorn = await prisma.user.create({
      data: {
        username: "korn_staff",
        email: "staff.korn@togethergo.com",
        passwordHash: commonPassword,
        isVerified: true,
        idCardStatus: "APPROVED",
        screeningStatus: "PASSED",
        onboardingStep: 5,
        roles: { create: [{ role: "STAFF" }, { role: "USER" }] },
        profile: {
          create: {
            fullName: "กรณ์ สิทธิโชค",
            nickname: "กรณ์",
            phone: "0823456789",
            bio: "เจ้าหน้าที่ฝ่ายตรวจสอบความปลอดภัยและประสานงาน Together Go",
          },
        },
      },
    });
    console.log("Demo Staff created: korn_staff");
  }

  // Ensure staff permissions assignment
  await prisma.staffAssignment.upsert({
    where: { userId: staffKorn.id },
    update: {},
    create: {
      userId: staffKorn.id,
      grantedBy: "admin",
      permissions: JSON.stringify([
        "VERIFY_ID",
        "VERIFY_SCREENING",
        "MANAGE_ACCOMMODATION",
        "HANDLE_EMERGENCY",
      ]),
    },
  });

  // 4. Accommodations
  let acc1 = await prisma.accommodation.findFirst({ where: { name: { contains: "แม่แจ่ม" } } });
  if (!acc1) {
    acc1 = await prisma.accommodation.create({
      data: {
        hostId: hostSomchai.id,
        name: "บ้านต้นไม้ แม่แจ่ม วิวดอยอินทนนท์",
        description: "บ้านพักไม้สักธรรมชาติ วิวทุ่งนาขั้นบันไดและทะเลหมอก อากาศเย็นสบายตลอดปี มีเตาปิ้งย่างและลานแคมป์ไฟ",
        province: "เชียงใหม่",
        address: "ต.แม่นาจร อ.แม่แจ่ม จ.เชียงใหม่",
        pricePerNight: 1800,
        maxGuests: 6,
        status: "APPROVED",
        imagesJson: JSON.stringify([
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        ]),
      },
    });
  }

  let acc2 = await prisma.accommodation.findFirst({ where: { name: { contains: "อ่าวนาง" } } });
  if (!acc2) {
    acc2 = await prisma.accommodation.create({
      data: {
        hostId: hostSomchai.id,
        name: "อ่าวนาง ซันเซ็ต บีช รีสอร์ท",
        description: "รีสอร์ทติดริมหาดอ่าวนาง บรรยากาศเงียบสงบ สระว่ายน้ำกลางแจ้ง ใกล้ท่าเรือไปเกาะพีพีและไร่เลย์",
        province: "กระบี่",
        address: "หาดอ่าวนาง ต.อ่าวนาง อ.เมือง จ.กระบี่",
        pricePerNight: 2400,
        maxGuests: 8,
        status: "APPROVED",
        imagesJson: JSON.stringify([
          "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
        ]),
      },
    });
  }

  // 5. Trip 1 (Doi Inthanon)
  let trip1 = await prisma.trip.findFirst({
    where: { title: { contains: "ดอยอินทนนท์" } },
  });

  if (!trip1) {
    trip1 = await prisma.trip.create({
      data: {
        creatorId: fern.id,
        accommodationId: acc1.id,
        title: "กอดหมอกหน้าหนาว ดอยอินทนนท์-แม่แจ่ม 3 วัน 2 คืน",
        description: "ทริปชวนเพื่อนใหม่ไปสัมผัสอากาศหนาว ดูพระอาทิตย์ขึ้นที่กิ่วแม่ปาน ชมนาขั้นบันไดแม่แจ่ม กินหมูกระทะบนยอดดอย เน้นเที่ยวชิลๆ ถ่ายรูปสวย ไม่เร่งรีบ มีรถยนต์ส่วนตัวพร้อมเดินทาง",
        province: "เชียงใหม่",
        coverImage: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80",
        startDate: new Date("2026-12-05"),
        endDate: new Date("2026-12-07"),
        maxMembers: 4,
        totalFuelDistance: 320,
        fuelPricePerLiter: 36.5,
        estimatedFuelCost: 320 * 36.5,
        status: "OPEN",
        members: {
          create: [
            { userId: fern.id, status: "APPROVED" },
            { userId: admin.id, status: "PAID" },
          ],
        },
        roles: {
          create: [
            { roleName: "ไกด์นำทาง", description: "วางแผนเส้นทางและจุดถ่ายรูปสวยๆ", userId: fern.id },
            { roleName: "ดูแลที่พัก", description: "ประสานงานเช็คอิน-เช็คเอาท์ที่พัก" },
            { roleName: "จัดหาเสบียง/ร้านอาหาร", description: "เลือกร้านเด็ดและจัดเตรียมเครื่องดื่ม" },
            { roleName: "คนขับรถ", description: "คนขับหลักของทริป ปลอดภัย มีใบขับขี่", userId: fern.id },
          ],
        },
      },
    });
  }

  // Ensure Admin is PAID member in trip1
  await prisma.tripMember.upsert({
    where: { tripId_userId: { tripId: trip1.id, userId: admin.id } },
    update: { status: "PAID" },
    create: { tripId: trip1.id, userId: admin.id, status: "PAID" },
  });

  // Ensure Driver Application & Vote (Phase 4)
  const existingDriverApp = await prisma.driverApplication.findFirst({
    where: { tripId: trip1.id, userId: fern.id },
  });
  if (!existingDriverApp) {
    await prisma.driverApplication.create({
      data: {
        tripId: trip1.id,
        userId: fern.id,
        vehicleInfo: "Honda HR-V สีดำ ทะเบียน 3กผ 9876 เชียงใหม่",
        status: "SELECTED",
      },
    });
  } else {
    await prisma.driverApplication.update({
      where: { id: existingDriverApp.id },
      data: { status: "SELECTED" },
    });
  }

  await prisma.driverVote.upsert({
    where: { tripId_voterId: { tripId: trip1.id, voterId: admin.id } },
    update: { candidateId: fern.id },
    create: { tripId: trip1.id, voterId: admin.id, candidateId: fern.id },
  });

  // Ensure Group Messages (Phase 6)
  const msgCount = await prisma.message.count({ where: { tripId: trip1.id } });
  if (msgCount < 2) {
    await prisma.message.create({
      data: {
        tripId: trip1.id,
        userId: fern.id,
        content: "สวัสดีค่ะทุกคน! ยินดีต้อนรับสู่ทริปดอยอินทนนท์นะคะ เตรียมเสื้อกันหนาวหนาๆ มาด้วยน้า",
      },
    });
    await prisma.message.create({
      data: {
        tripId: trip1.id,
        userId: admin.id,
        content: "สวัสดีครับใบเฟิร์น พร้อมออกเดินทางครับ เดี๋ยวเจอกันที่จุดนัดพบสนามบินเชียงใหม่ครับ",
      },
    });
  }

  // Ensure Emergency Alert (Phase 6)
  const existingAlert = await prisma.emergencyAlert.findFirst({ where: { tripId: trip1.id } });
  if (!existingAlert) {
    await prisma.emergencyAlert.create({
      data: {
        tripId: trip1.id,
        userId: fern.id,
        latitude: 18.5888,
        longitude: 98.4871,
        notes: "ทดสอบการแจ้งเหตุฉุกเฉิน SOS พิกัดดอยอินทนนท์เพื่อการทดสอบระบบ",
        status: "ACTIVE",
      },
    });
  }

  // Ensure Ratings for Driver & Member (Phase 6)
  const existingDriverRating = await prisma.rating.findFirst({
    where: { authorId: admin.id, targetId: fern.id, ratingType: "DRIVER" },
  });
  if (!existingDriverRating) {
    await prisma.rating.create({
      data: {
        authorId: admin.id,
        targetId: fern.id,
        tripId: trip1.id,
        ratingType: "DRIVER",
        score: 5,
        comment: "ขับรถนุ่มนวลมาก ระมัดระวังตลอดทาง สุภาพ เป็นกันเองสุดๆ",
      },
    });
  }

  const existingMemberRating = await prisma.rating.findFirst({
    where: { authorId: admin.id, targetId: fern.id, ratingType: "MEMBER" },
  });
  if (!existingMemberRating) {
    await prisma.rating.create({
      data: {
        authorId: admin.id,
        targetId: fern.id,
        tripId: trip1.id,
        ratingType: "MEMBER",
        score: 5,
        comment: "เป็นเพื่อนร่วมทริปที่น่ารักมาก วางแผนละเอียด ถ่ายรูปสวยมากครับ",
      },
    });
  }

  // Ensure Booking & Payout (Phase 7)
  let booking1 = await prisma.booking.findFirst({ where: { tripId: trip1.id } });
  if (!booking1) {
    booking1 = await prisma.booking.create({
      data: {
        tripId: trip1.id,
        accommodationId: acc1.id,
        checkInDate: new Date("2026-12-05"),
        checkOutDate: new Date("2026-12-07"),
        totalAmount: 3600,
        status: "BOOKED",
      },
    });
  } else {
    await prisma.booking.update({
      where: { id: booking1.id },
      data: { status: "BOOKED" },
    });
  }

  const existingPayout = await prisma.hostPayout.findFirst({ where: { bookingId: booking1.id } });
  if (!existingPayout) {
    await prisma.hostPayout.create({
      data: {
        bookingId: booking1.id,
        hostId: hostSomchai.id,
        amount: 3600,
        status: "TRANSFERRED",
        transferProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
        transferredAt: new Date(),
      },
    });
  } else {
    await prisma.hostPayout.update({
      where: { id: existingPayout.id },
      data: {
        status: "TRANSFERRED",
        transferProofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
      },
    });
  }

  // Ensure Payment (Phase 9)
  const existingPayment = await prisma.payment.findFirst({
    where: { tripId: trip1.id, userId: admin.id },
  });
  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        userId: admin.id,
        tripId: trip1.id,
        amount: 950,
        platformFee: 50,
        shareAmount: 900,
        status: "SUCCESS",
        gatewayRef: "SANDBOX-TG-DEMO-001",
      },
    });
  }

  // Ensure Email Logs (Phase 8)
  const emailLogCount = await prisma.emailLog.count();
  if (emailLogCount < 2) {
    const tpl1 = generateEmailTemplate("IDENTITY_APPROVED", "พิมพ์มาดา รัตนกุล");
    await prisma.emailLog.create({
      data: {
        toEmail: "fern@togethergo.com",
        toName: "พิมพ์มาดา รัตนกุล",
        subject: tpl1.subject,
        eventType: "IDENTITY_APPROVED",
        bodyHtml: tpl1.html,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    const tpl2 = generateEmailTemplate("PAYMENT_SUCCESS", "ผู้ดูแลระบบ", {
      tripTitle: trip1.title,
      amount: 950,
      paymentRef: "SANDBOX-TG-DEMO-001",
    });
    await prisma.emailLog.create({
      data: {
        toEmail: "admin@togethergo.com",
        toName: "ผู้ดูแลระบบ",
        subject: tpl2.subject,
        eventType: "PAYMENT_SUCCESS",
        bodyHtml: tpl2.html,
        status: "SENT",
        sentAt: new Date(),
      },
    });
  }

  console.log("Full demo lifecycle data guaranteed for Trip 1!");
}

async function main() {
  console.log("Seeding Together Go comprehensive database...");
  await seedDefaultAdminAndSettings();
  await seedDemoAccommodationsAndTrips();
  console.log("Database seeded successfully for all Phases (1 - 9)!");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
