SET FOREIGN_KEY_CHECKS=0;
CREATE TABLE IF NOT EXISTS `Accommodation` (
	`id`	VARCHAR(255) NOT NULL,
	`hostId`	VARCHAR(255) NOT NULL,
	`name`	VARCHAR(255) NOT NULL,
	`description`	VARCHAR(255) NOT NULL,
	`province`	VARCHAR(255) NOT NULL,
	`address`	VARCHAR(255) NOT NULL,
	`pricePerNight`	REAL NOT NULL,
	`maxGuests`	INTEGER NOT NULL,
	`imagesJson`	VARCHAR(255),
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PENDING',
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `Accommodation_hostId_fkey` FOREIGN KEY(`hostId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `AppSettings` (
	`id`	VARCHAR(255) NOT NULL DEFAULT 'default',
	`platformFeePerUser`	REAL NOT NULL DEFAULT 50.0,
	`screeningThreshold`	INTEGER NOT NULL DEFAULT 9,
	`screeningCooldownDays`	INTEGER NOT NULL DEFAULT 3,
	`emailSenderDomain`	VARCHAR(255) NOT NULL DEFAULT 'noreply@togethergo.com',
	`smtpHost`	VARCHAR(255) NOT NULL DEFAULT '',
	`smtpPort`	INTEGER NOT NULL DEFAULT 587,
	`smtpUser`	VARCHAR(255) NOT NULL DEFAULT '',
	`smtpPass`	VARCHAR(255) NOT NULL DEFAULT '',
	`smtpEnabled`	BOOLEAN NOT NULL DEFAULT false,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `Booking` (
	`id`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`accommodationId`	VARCHAR(255) NOT NULL,
	`checkInDate`	DATETIME NOT NULL,
	`checkOutDate`	DATETIME NOT NULL,
	`totalAmount`	REAL NOT NULL,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PENDING',
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `Booking_accommodationId_fkey` FOREIGN KEY(`accommodationId`) REFERENCES `Accommodation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `Booking_tripId_fkey` FOREIGN KEY(`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `Consent` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`consentType`	VARCHAR(255) NOT NULL,
	`version`	VARCHAR(255) NOT NULL DEFAULT '1.0',
	`agreed`	BOOLEAN NOT NULL DEFAULT true,
	`agreedAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`ipAddress`	VARCHAR(255),
	`userAgent`	VARCHAR(255),
	`revokedAt`	DATETIME,
	PRIMARY KEY(`id`),
	CONSTRAINT `Consent_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `DriverApplication` (
	`id`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`licenseDocUrl`	VARCHAR(255),
	`vehicleInfo`	VARCHAR(255),
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PENDING',
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `DriverApplication_tripId_fkey` FOREIGN KEY(`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `DriverApplication_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `DriverVote` (
	`id`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`voterId`	VARCHAR(255) NOT NULL,
	`candidateId`	VARCHAR(255) NOT NULL,
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `DriverVote_tripId_fkey` FOREIGN KEY(`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `DriverVote_voterId_fkey` FOREIGN KEY(`voterId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `EmailLog` (
	`id`	VARCHAR(255) NOT NULL,
	`toEmail`	VARCHAR(255) NOT NULL,
	`toName`	VARCHAR(255),
	`subject`	VARCHAR(255) NOT NULL,
	`eventType`	VARCHAR(255) NOT NULL,
	`bodyHtml`	VARCHAR(255) NOT NULL,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PREVIEW',
	`errorMsg`	VARCHAR(255),
	`relatedId`	VARCHAR(255),
	`sentAt`	DATETIME,
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `EmergencyAlert` (
	`id`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`latitude`	REAL NOT NULL,
	`longitude`	REAL NOT NULL,
	`notes`	VARCHAR(255),
	`status`	VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
	`resolvedAt`	DATETIME,
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `EmergencyAlert_tripId_fkey` FOREIGN KEY(`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `EmergencyAlert_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `EmergencyContact` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`name`	VARCHAR(255) NOT NULL,
	`relationship`	VARCHAR(255) NOT NULL,
	`phone`	VARCHAR(255) NOT NULL,
	`altPhone`	VARCHAR(255),
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `EmergencyContact_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `HostPayout` (
	`id`	VARCHAR(255) NOT NULL,
	`bookingId`	VARCHAR(255) NOT NULL,
	`hostId`	VARCHAR(255) NOT NULL,
	`amount`	REAL NOT NULL,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PENDING',
	`transferProofUrl`	VARCHAR(255),
	`transferredAt`	DATETIME,
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `HostPayout_bookingId_fkey` FOREIGN KEY(`bookingId`) REFERENCES `Booking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `Message` (
	`id`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`content`	VARCHAR(255) NOT NULL,
	`imageUrl`	VARCHAR(255),
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `Message_tripId_fkey` FOREIGN KEY(`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `Message_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `Payment` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`amount`	REAL NOT NULL,
	`platformFee`	REAL NOT NULL DEFAULT 0,
	`shareAmount`	REAL NOT NULL DEFAULT 0,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PENDING',
	`gatewayRef`	VARCHAR(255),
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `Payment_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `Profile` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`fullName`	VARCHAR(255) NOT NULL,
	`nickname`	VARCHAR(255),
	`phone`	VARCHAR(255),
	`gender`	VARCHAR(255),
	`birthDate`	DATETIME,
	`bio`	VARCHAR(255),
	`avatarUrl`	VARCHAR(255),
	`idCardNumber`	VARCHAR(255),
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `Profile_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `Rating` (
	`id`	VARCHAR(255) NOT NULL,
	`authorId`	VARCHAR(255) NOT NULL,
	`targetId`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255),
	`ratingType`	VARCHAR(255) NOT NULL,
	`score`	INTEGER NOT NULL,
	`comment`	VARCHAR(255),
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `Rating_authorId_fkey` FOREIGN KEY(`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `Rating_targetId_fkey` FOREIGN KEY(`targetId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `Report` (
	`id`	VARCHAR(255) NOT NULL,
	`reporterId`	VARCHAR(255) NOT NULL,
	`reportedUserId`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255),
	`reason`	VARCHAR(255) NOT NULL,
	`details`	VARCHAR(255) NOT NULL,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PENDING',
	`adminNotes`	VARCHAR(255),
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `Report_reportedUserId_fkey` FOREIGN KEY(`reportedUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `Report_reporterId_fkey` FOREIGN KEY(`reporterId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `ScreeningAttempt` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`answersJson`	VARCHAR(255) NOT NULL,
	`totalScore`	INTEGER NOT NULL,
	`maxPossibleScore`	INTEGER NOT NULL DEFAULT 27,
	`riskLevel`	VARCHAR(255) NOT NULL,
	`status`	VARCHAR(255) NOT NULL,
	`nextEligibleDate`	DATETIME NOT NULL,
	`reviewNotes`	VARCHAR(255),
	`reviewedBy`	VARCHAR(255),
	`attemptDate`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `ScreeningAttempt_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `StaffAssignment` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`grantedBy`	VARCHAR(255) NOT NULL,
	`permissions`	VARCHAR(255) NOT NULL DEFAULT '[]',
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `Trip` (
	`id`	VARCHAR(255) NOT NULL,
	`creatorId`	VARCHAR(255) NOT NULL,
	`accommodationId`	VARCHAR(255),
	`title`	VARCHAR(255) NOT NULL,
	`description`	VARCHAR(255) NOT NULL,
	`province`	VARCHAR(255) NOT NULL,
	`coverImage`	VARCHAR(255),
	`startDate`	DATETIME NOT NULL,
	`endDate`	DATETIME NOT NULL,
	`maxMembers`	INTEGER NOT NULL,
	`totalFuelDistance`	REAL NOT NULL DEFAULT 0,
	`fuelPricePerLiter`	REAL NOT NULL DEFAULT 35,
	`estimatedFuelCost`	REAL NOT NULL DEFAULT 0,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'OPEN',
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `Trip_accommodationId_fkey` FOREIGN KEY(`accommodationId`) REFERENCES `Accommodation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
	CONSTRAINT `Trip_creatorId_fkey` FOREIGN KEY(`creatorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `TripMember` (
	`id`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'REQUESTED',
	`joinedAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `TripMember_tripId_fkey` FOREIGN KEY(`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `TripMember_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `TripRole` (
	`id`	VARCHAR(255) NOT NULL,
	`tripId`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255),
	`roleName`	VARCHAR(255) NOT NULL,
	`description`	VARCHAR(255),
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `TripRole_tripId_fkey` FOREIGN KEY(`tripId`) REFERENCES `Trip`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT `TripRole_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `User` (
	`id`	VARCHAR(255) NOT NULL,
	`email`	VARCHAR(255) NOT NULL,
	`username`	VARCHAR(255) NOT NULL,
	`passwordHash`	VARCHAR(255) NOT NULL,
	`isVerified`	BOOLEAN NOT NULL DEFAULT false,
	`idCardStatus`	VARCHAR(255) NOT NULL DEFAULT 'NOT_SUBMITTED',
	`screeningStatus`	VARCHAR(255) NOT NULL DEFAULT 'NOT_STARTED',
	`onboardingStep`	INTEGER NOT NULL DEFAULT 1,
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`)
);
CREATE TABLE IF NOT EXISTS `UserRole` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`role`	VARCHAR(255) NOT NULL,
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY(`id`),
	CONSTRAINT `UserRole_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS `VerificationDocument` (
	`id`	VARCHAR(255) NOT NULL,
	`userId`	VARCHAR(255) NOT NULL,
	`documentType`	VARCHAR(255) NOT NULL,
	`fileUrl`	VARCHAR(255) NOT NULL,
	`fileName`	VARCHAR(255),
	`fileSize`	INTEGER,
	`status`	VARCHAR(255) NOT NULL DEFAULT 'PENDING',
	`rejectionReason`	VARCHAR(255),
	`reviewedBy`	VARCHAR(255),
	`reviewedAt`	DATETIME,
	`createdAt`	DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt`	DATETIME NOT NULL,
	PRIMARY KEY(`id`),
	CONSTRAINT `VerificationDocument_userId_fkey` FOREIGN KEY(`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO `Accommodation` VALUES ('8f50c1a0-04a0-4039-aec2-deaf41e85577','94114f76-974d-49e1-a659-1b102ed1832b','บ้านต้นไม้ แม่แจ่ม วิวดอยอินทนนท์','บ้านพักไม้สักธรรมชาติ วิวทุ่งนาขั้นบันไดและทะเลหมอก อากาศเย็นสบายตลอดปี มีเตาปิ้งย่างและลานแคมป์ไฟ','เชียงใหม่','ต.แม่นาจร อ.แม่แจ่ม จ.เชียงใหม่',1800.0,6,'[`https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80`]','APPROVED',1794527430088,1794527430088);
INSERT INTO `Accommodation` VALUES ('49d2ddd0-7fbf-47ec-a4b2-dfc53fb48203','94114f76-974d-49e1-a659-1b102ed1832b','อ่าวนาง ซันเซ็ต บีช รีสอร์ท','รีสอร์ทติดริมหาดอ่าวนาง บรรยากาศเงียบสงบ สระว่ายน้ำกลางแจ้ง ใกล้ท่าเรือไปเกาะพีพีและไร่เลย์','กระบี่','หาดอ่าวนาง ต.อ่าวนาง อ.เมือง จ.กระบี่',2400.0,8,'[`https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80`]','APPROVED',1794527430092,1794527430092);
INSERT INTO `Accommodation` VALUES ('726f5ab9-6dbc-4d36-a094-5d4bbc33bd8c','94114f76-974d-49e1-a659-1b102ed1832b','ริเวอร์แคว กรีน แคมป์ปิ้ง ราฟท์','แพพักริมแม่น้ำแควน้อย กาญจนบุรี ล้อมรอบด้วยขุนเขา มีกิจกรรมล่องแพเปียก พายเรือคายัค และห้องพักติดแอร์','กาญจนบุรี','ไทรโยคใหญ่ อ.ไทรโยค จ.กาญจนบุรี',1500.0,6,'[`https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80`]','APPROVED',1794527430096,1794527430096);
INSERT INTO `Accommodation` VALUES ('b71482c9-a120-46a8-b726-268d96669941','94114f76-974d-49e1-a659-1b102ed1832b','โฮมสเตย์ริมน้ำ ปัว กลิ่นไอหมอก','โฮมสเตย์เรือนไม้โบราณริมลำธาร ท่ามกลางทุ่งนาสีเขียวเมืองปัว ใกล้วัดภูเก็ตและถนนลอยฟ้า','น่าน','ต.ศิลาแลง อ.ปัว จ.น่าน',1200.0,4,'[`https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80`]','APPROVED',1794527430099,1794527430099);
INSERT INTO `AppSettings` VALUES ('default',50.0,9,3,'noreply@togethergo.com','',587,'','',0,1794525213059);
INSERT INTO `Booking` VALUES ('fbd920b6-ae2d-4e5d-bdf3-a11a89ce3e6c','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','8f50c1a0-04a0-4039-aec2-deaf41e85577',1796428800000,1796601600000,3600.0,'BOOKED',1794548223047,1794548223047);
INSERT INTO `Consent` VALUES ('4698bb53-0df0-4702-a887-49a99db9d4ab','d324dd34-73fe-402f-b0c0-2394f40e9b30','PDPA','1.0',1,1794525925422,'127.0.0.1','Jest-Test-Agent',NULL);
INSERT INTO `Consent` VALUES ('11d3b5a7-a86b-4191-90d4-38106137ce41','17364f30-a12a-412f-a3d0-e67bdf5cc21a','PDPA','1.0',1,1794525958227,'127.0.0.1','Jest-Test-Agent',NULL);
INSERT INTO `Consent` VALUES ('c0492b65-0d4b-49b0-98b6-3d1a7598d669','f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','PDPA','1.0',1,1794526407827,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',NULL);
INSERT INTO `Consent` VALUES ('b22f5837-e55b-4c22-bfff-cf42eabecb07','94114f76-974d-49e1-a659-1b102ed1832b','PDPA','1.0',1,1794526482291,'::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36',NULL);
INSERT INTO `Consent` VALUES ('ac294303-3328-48c9-a947-ccf336ffae7e','f86d4613-56e2-401f-9e51-f6ae60f0ab27','PDPA','1.0',1,1794527853915,'127.0.0.1','Jest-Test-Agent',NULL);
INSERT INTO `Consent` VALUES ('c4c697a7-ad8d-4645-86d7-3a71d3a48eef','15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','PDPA','1.0',1,1794546945111,'127.0.0.1','Jest-Test-Agent',NULL);
INSERT INTO `Consent` VALUES ('7228db9f-40ff-44ab-88ba-a2e0929c9552','6759377d-a89d-4215-b620-37518e21f793','PDPA','1.0',1,1794548254885,'127.0.0.1','Jest-Test-Agent',NULL);
INSERT INTO `Consent` VALUES ('e95ab92c-a55e-43fd-a1cc-0647188c0883','d217e283-fb16-42d2-83c2-5ffe73472a51','PDPA','1.0',1,1794548389695,'127.0.0.1','Jest-Test-Agent',NULL);
INSERT INTO `DriverApplication` VALUES ('afbe239e-b30f-4a1f-bb46-6019aa0d1fbe','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3',NULL,'Honda HR-V สีดำ ทะเบียน 3กผ 9876 เชียงใหม่','SELECTED',1794548223022);
INSERT INTO `DriverVote` VALUES ('9f611884-dad0-41b6-93ed-69cc6383a3af','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','94114f76-974d-49e1-a659-1b102ed1832b','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3',1794548223025);
INSERT INTO `EmailLog` VALUES ('c1f7a0b9-0b7d-4f1d-9ce6-396628d8dabd','test.traveler@example.com','นักเดินทางทดสอบ','✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว','TRIP_JOIN_APPROVED','
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=`utf-8`>
        <meta name=`viewport` content=`width=device-width, initial-scale=1.0`>
        <title>✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว</title>
      </head>
      <body style=`margin: 0; padding: 0; background-color: #F8FAFC; font-family: ''Prompt'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; color: #1E293B;`>
        <table width=`100%` cellpadding=`0` cellspacing=`0` style=`background-color: #F8FAFC; padding: 24px 0;`>
          <tr>
            <td align=`center`>
              <table width=`600` cellpadding=`0` cellspacing=`0` style=`background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);`>
                <!-- Header -->
                <tr>
                  <td style=`background-color: #0F294A; padding: 24px; VARCHAR(255)-align: center;`>
                    <h1 style=`color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;`>
                      Together <span style=`color: #0D9488;`>Go</span>
                    </h1>
                    <p style=`color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;`>เที่ยวด้วยกัน ปลอดภัย มั่นใจในทุกคน</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style=`padding: 32px 28px;`>
                    <p style=`font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 16px;`>สวัสดีคุณ นักเดินทางทดสอบ,</p>
                    
        <h2 style=`color: #0D9488; margin-top: 0;`>ผู้สร้างทริปอนุมัติคำขอของคุณแล้ว!</h2>
        <p>คำขอเข้าร่วมทริป <strong>`ทริปเชียงใหม่`</strong> ได้รับการอนุมัติเรียบร้อยแล้ว กรุณาดำเนินการชำระเงินส่วนแบ่งค่าที่พักและค่าธรรมเนียมเพื่อยืนยันที่นั่งของคุณ</p>
        <div style=`background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;`>
          <p style=`margin: 0; font-size: 14px; color: #64748B;`>ยอดที่ต้องชำระ:</p>
          <p style=`margin: 4px 0; font-size: 24px; font-weight: bold; color: #0D9488;`>฿1,500 THB</p>
          <p style=`margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;`>(ค่าที่พักหารต่อคน + ค่าธรรมเนียมแพลตฟอร์ม)</p>
        </div>
        <p><a href=`http://localhost:3000/my-trips` style=`display: inline-block; background-color: #0D9488; color: #ffffff; VARCHAR(255)-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;`>ชำระเงินเพื่อยืนยันที่นั่ง</a></p>
      
                    <hr style=`border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;` />
                    <p style=`font-size: 13px; color: #64748B; margin: 0;`>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถตอบกลับอีเมลนี้หรือติดต่อทีมงานได้ตลอด 24 ชม.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style=`background-color: #F1F5F9; padding: 16px 28px; VARCHAR(255)-align: center; font-size: 12px; color: #94A3B8;`>
                    <p style=`margin: 0;`>Together Go Platform © 2026 • ระบบแจ้งเตือนอัตโนมัติ</p>
                    <p style=`margin: 4px 0 0 0;`>ศูนย์ความปลอดภัย: 191 | การแพทย์ฉุกเฉิน: 1669</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  ','PREVIEW',NULL,'58b5b660-8a0b-4d66-a1c3-7efa7a774d06',1794547987078,1794547987079);
INSERT INTO `EmailLog` VALUES ('869dffe2-76d0-4147-86d5-6d71ec4b7c1f','test.traveler@example.com','นักเดินทางทดสอบ','✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว','TRIP_JOIN_APPROVED','
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=`utf-8`>
        <meta name=`viewport` content=`width=device-width, initial-scale=1.0`>
        <title>✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว</title>
      </head>
      <body style=`margin: 0; padding: 0; background-color: #F8FAFC; font-family: ''Prompt'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; color: #1E293B;`>
        <table width=`100%` cellpadding=`0` cellspacing=`0` style=`background-color: #F8FAFC; padding: 24px 0;`>
          <tr>
            <td align=`center`>
              <table width=`600` cellpadding=`0` cellspacing=`0` style=`background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);`>
                <!-- Header -->
                <tr>
                  <td style=`background-color: #0F294A; padding: 24px; VARCHAR(255)-align: center;`>
                    <h1 style=`color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;`>
                      Together <span style=`color: #0D9488;`>Go</span>
                    </h1>
                    <p style=`color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;`>เที่ยวด้วยกัน ปลอดภัย มั่นใจในทุกคน</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style=`padding: 32px 28px;`>
                    <p style=`font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 16px;`>สวัสดีคุณ นักเดินทางทดสอบ,</p>
                    
        <h2 style=`color: #0D9488; margin-top: 0;`>ผู้สร้างทริปอนุมัติคำขอของคุณแล้ว!</h2>
        <p>คำขอเข้าร่วมทริป <strong>`ทริปเชียงใหม่`</strong> ได้รับการอนุมัติเรียบร้อยแล้ว กรุณาดำเนินการชำระเงินส่วนแบ่งค่าที่พักและค่าธรรมเนียมเพื่อยืนยันที่นั่งของคุณ</p>
        <div style=`background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;`>
          <p style=`margin: 0; font-size: 14px; color: #64748B;`>ยอดที่ต้องชำระ:</p>
          <p style=`margin: 4px 0; font-size: 24px; font-weight: bold; color: #0D9488;`>฿1,500 THB</p>
          <p style=`margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;`>(ค่าที่พักหารต่อคน + ค่าธรรมเนียมแพลตฟอร์ม)</p>
        </div>
        <p><a href=`http://localhost:3000/my-trips` style=`display: inline-block; background-color: #0D9488; color: #ffffff; VARCHAR(255)-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;`>ชำระเงินเพื่อยืนยันที่นั่ง</a></p>
      
                    <hr style=`border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;` />
                    <p style=`font-size: 13px; color: #64748B; margin: 0;`>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถตอบกลับอีเมลนี้หรือติดต่อทีมงานได้ตลอด 24 ชม.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style=`background-color: #F1F5F9; padding: 16px 28px; VARCHAR(255)-align: center; font-size: 12px; color: #94A3B8;`>
                    <p style=`margin: 0;`>Together Go Platform © 2026 • ระบบแจ้งเตือนอัตโนมัติ</p>
                    <p style=`margin: 4px 0 0 0;`>ศูนย์ความปลอดภัย: 191 | การแพทย์ฉุกเฉิน: 1669</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  ','PREVIEW',NULL,'58b5b660-8a0b-4d66-a1c3-7efa7a774d06',1794548162601,1794548162602);
INSERT INTO `EmailLog` VALUES ('8ba944bd-40ca-4340-9ddb-d6ae0ee1dc06','test.traveler@example.com','นักเดินทางทดสอบ','✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว','TRIP_JOIN_APPROVED','
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=`utf-8`>
        <meta name=`viewport` content=`width=device-width, initial-scale=1.0`>
        <title>✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว</title>
      </head>
      <body style=`margin: 0; padding: 0; background-color: #F8FAFC; font-family: ''Prompt'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; color: #1E293B;`>
        <table width=`100%` cellpadding=`0` cellspacing=`0` style=`background-color: #F8FAFC; padding: 24px 0;`>
          <tr>
            <td align=`center`>
              <table width=`600` cellpadding=`0` cellspacing=`0` style=`background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);`>
                <!-- Header -->
                <tr>
                  <td style=`background-color: #0F294A; padding: 24px; VARCHAR(255)-align: center;`>
                    <h1 style=`color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;`>
                      Together <span style=`color: #0D9488;`>Go</span>
                    </h1>
                    <p style=`color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;`>เที่ยวด้วยกัน ปลอดภัย มั่นใจในทุกคน</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style=`padding: 32px 28px;`>
                    <p style=`font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 16px;`>สวัสดีคุณ นักเดินทางทดสอบ,</p>
                    
        <h2 style=`color: #0D9488; margin-top: 0;`>ผู้สร้างทริปอนุมัติคำขอของคุณแล้ว!</h2>
        <p>คำขอเข้าร่วมทริป <strong>`ทริปเชียงใหม่`</strong> ได้รับการอนุมัติเรียบร้อยแล้ว กรุณาดำเนินการชำระเงินส่วนแบ่งค่าที่พักและค่าธรรมเนียมเพื่อยืนยันที่นั่งของคุณ</p>
        <div style=`background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;`>
          <p style=`margin: 0; font-size: 14px; color: #64748B;`>ยอดที่ต้องชำระ:</p>
          <p style=`margin: 4px 0; font-size: 24px; font-weight: bold; color: #0D9488;`>฿1,500 THB</p>
          <p style=`margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;`>(ค่าที่พักหารต่อคน + ค่าธรรมเนียมแพลตฟอร์ม)</p>
        </div>
        <p><a href=`http://localhost:3000/my-trips` style=`display: inline-block; background-color: #0D9488; color: #ffffff; VARCHAR(255)-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;`>ชำระเงินเพื่อยืนยันที่นั่ง</a></p>
      
                    <hr style=`border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;` />
                    <p style=`font-size: 13px; color: #64748B; margin: 0;`>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถตอบกลับอีเมลนี้หรือติดต่อทีมงานได้ตลอด 24 ชม.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style=`background-color: #F1F5F9; padding: 16px 28px; VARCHAR(255)-align: center; font-size: 12px; color: #94A3B8;`>
                    <p style=`margin: 0;`>Together Go Platform © 2026 • ระบบแจ้งเตือนอัตโนมัติ</p>
                    <p style=`margin: 4px 0 0 0;`>ศูนย์ความปลอดภัย: 191 | การแพทย์ฉุกเฉิน: 1669</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  ','PREVIEW',NULL,'58b5b660-8a0b-4d66-a1c3-7efa7a774d06',1794548243968,1794548243969);
INSERT INTO `EmailLog` VALUES ('d10e81b3-fb0c-4f29-ab51-52aa048c5b25','test.traveler@example.com','นักเดินทางทดสอบ','✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว','TRIP_JOIN_APPROVED','
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=`utf-8`>
        <meta name=`viewport` content=`width=device-width, initial-scale=1.0`>
        <title>✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว</title>
      </head>
      <body style=`margin: 0; padding: 0; background-color: #F8FAFC; font-family: ''Prompt'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; color: #1E293B;`>
        <table width=`100%` cellpadding=`0` cellspacing=`0` style=`background-color: #F8FAFC; padding: 24px 0;`>
          <tr>
            <td align=`center`>
              <table width=`600` cellpadding=`0` cellspacing=`0` style=`background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);`>
                <!-- Header -->
                <tr>
                  <td style=`background-color: #0F294A; padding: 24px; VARCHAR(255)-align: center;`>
                    <h1 style=`color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;`>
                      Together <span style=`color: #0D9488;`>Go</span>
                    </h1>
                    <p style=`color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;`>เที่ยวด้วยกัน ปลอดภัย มั่นใจในทุกคน</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style=`padding: 32px 28px;`>
                    <p style=`font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 16px;`>สวัสดีคุณ นักเดินทางทดสอบ,</p>
                    
        <h2 style=`color: #0D9488; margin-top: 0;`>ผู้สร้างทริปอนุมัติคำขอของคุณแล้ว!</h2>
        <p>คำขอเข้าร่วมทริป <strong>`ทริปเชียงใหม่`</strong> ได้รับการอนุมัติเรียบร้อยแล้ว กรุณาดำเนินการชำระเงินส่วนแบ่งค่าที่พักและค่าธรรมเนียมเพื่อยืนยันที่นั่งของคุณ</p>
        <div style=`background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;`>
          <p style=`margin: 0; font-size: 14px; color: #64748B;`>ยอดที่ต้องชำระ:</p>
          <p style=`margin: 4px 0; font-size: 24px; font-weight: bold; color: #0D9488;`>฿1,500 THB</p>
          <p style=`margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;`>(ค่าที่พักหารต่อคน + ค่าธรรมเนียมแพลตฟอร์ม)</p>
        </div>
        <p><a href=`http://localhost:3000/my-trips` style=`display: inline-block; background-color: #0D9488; color: #ffffff; VARCHAR(255)-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;`>ชำระเงินเพื่อยืนยันที่นั่ง</a></p>
      
                    <hr style=`border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;` />
                    <p style=`font-size: 13px; color: #64748B; margin: 0;`>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถตอบกลับอีเมลนี้หรือติดต่อทีมงานได้ตลอด 24 ชม.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style=`background-color: #F1F5F9; padding: 16px 28px; VARCHAR(255)-align: center; font-size: 12px; color: #94A3B8;`>
                    <p style=`margin: 0;`>Together Go Platform © 2026 • ระบบแจ้งเตือนอัตโนมัติ</p>
                    <p style=`margin: 4px 0 0 0;`>ศูนย์ความปลอดภัย: 191 | การแพทย์ฉุกเฉิน: 1669</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  ','PREVIEW',NULL,'58b5b660-8a0b-4d66-a1c3-7efa7a774d06',1794548255525,1794548255526);
INSERT INTO `EmailLog` VALUES ('c2f6614b-c18c-4c1d-9d83-85e353539bbc','test.traveler@example.com','นักเดินทางทดสอบ','✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว','TRIP_JOIN_APPROVED','
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset=`utf-8`>
        <meta name=`viewport` content=`width=device-width, initial-scale=1.0`>
        <title>✅ คำขอเข้าร่วมทริป `ทริปเชียงใหม่` ได้รับการอนุมัติแล้ว</title>
      </head>
      <body style=`margin: 0; padding: 0; background-color: #F8FAFC; font-family: ''Prompt'', -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif; color: #1E293B;`>
        <table width=`100%` cellpadding=`0` cellspacing=`0` style=`background-color: #F8FAFC; padding: 24px 0;`>
          <tr>
            <td align=`center`>
              <table width=`600` cellpadding=`0` cellspacing=`0` style=`background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);`>
                <!-- Header -->
                <tr>
                  <td style=`background-color: #0F294A; padding: 24px; VARCHAR(255)-align: center;`>
                    <h1 style=`color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;`>
                      Together <span style=`color: #0D9488;`>Go</span>
                    </h1>
                    <p style=`color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;`>เที่ยวด้วยกัน ปลอดภัย มั่นใจในทุกคน</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style=`padding: 32px 28px;`>
                    <p style=`font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 16px;`>สวัสดีคุณ นักเดินทางทดสอบ,</p>
                    
        <h2 style=`color: #0D9488; margin-top: 0;`>ผู้สร้างทริปอนุมัติคำขอของคุณแล้ว!</h2>
        <p>คำขอเข้าร่วมทริป <strong>`ทริปเชียงใหม่`</strong> ได้รับการอนุมัติเรียบร้อยแล้ว กรุณาดำเนินการชำระเงินส่วนแบ่งค่าที่พักและค่าธรรมเนียมเพื่อยืนยันที่นั่งของคุณ</p>
        <div style=`background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;`>
          <p style=`margin: 0; font-size: 14px; color: #64748B;`>ยอดที่ต้องชำระ:</p>
          <p style=`margin: 4px 0; font-size: 24px; font-weight: bold; color: #0D9488;`>฿1,500 THB</p>
          <p style=`margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;`>(ค่าที่พักหารต่อคน + ค่าธรรมเนียมแพลตฟอร์ม)</p>
        </div>
        <p><a href=`http://localhost:3000/my-trips` style=`display: inline-block; background-color: #0D9488; color: #ffffff; VARCHAR(255)-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;`>ชำระเงินเพื่อยืนยันที่นั่ง</a></p>
      
                    <hr style=`border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;` />
                    <p style=`font-size: 13px; color: #64748B; margin: 0;`>หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถตอบกลับอีเมลนี้หรือติดต่อทีมงานได้ตลอด 24 ชม.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style=`background-color: #F1F5F9; padding: 16px 28px; VARCHAR(255)-align: center; font-size: 12px; color: #94A3B8;`>
                    <p style=`margin: 0;`>Together Go Platform © 2026 • ระบบแจ้งเตือนอัตโนมัติ</p>
                    <p style=`margin: 4px 0 0 0;`>ศูนย์ความปลอดภัย: 191 | การแพทย์ฉุกเฉิน: 1669</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  ','PREVIEW',NULL,'58b5b660-8a0b-4d66-a1c3-7efa7a774d06',1794548390336,1794548390337);
INSERT INTO `EmergencyAlert` VALUES ('3629d7eb-40b3-4dbd-91eb-c53c10d8de3c','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3',18.5888,98.4871,'ทดสอบการแจ้งเหตุฉุกเฉิน SOS พิกัดดอยอินทนนท์เพื่อการทดสอบระบบ','ACTIVE',NULL,1794548223036);
INSERT INTO `EmergencyContact` VALUES ('ed40c7e1-6d66-465c-94ad-24a9c40f2f1d','94114f76-974d-49e1-a659-1b102ed1832b','ศูนย์ความปลอดภัย Together Go','ผู้ดูแลระบบ','021234567',NULL,1794525213115,1794525213115);
INSERT INTO `EmergencyContact` VALUES ('8b010140-fd68-44af-85ae-954ea25bddc7','d324dd34-73fe-402f-b0c0-2394f40e9b30','สมศรี ผู้ปกครอง','PARENT','0819876543',NULL,1794525925434,1794525925434);
INSERT INTO `EmergencyContact` VALUES ('4876a78f-e03e-4f0f-ada4-3414c63c1503','17364f30-a12a-412f-a3d0-e67bdf5cc21a','สมศรี ผู้ปกครอง','PARENT','0819876543',NULL,1794525958237,1794525958237);
INSERT INTO `EmergencyContact` VALUES ('df6aafe0-2f86-4bba-8cff-290659c24d9c','f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','สมหญิง ใจดี','PARENT','0923456789',NULL,1794526623806,1794526623806);
INSERT INTO `EmergencyContact` VALUES ('5de91863-0c60-4370-b535-bb2ea6544950','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','คุณแม่พรพิมล','PARENT','0812223344',NULL,1794527430082,1794527430082);
INSERT INTO `EmergencyContact` VALUES ('2a5d10bb-af55-4478-9d94-a530b07a3883','f86d4613-56e2-401f-9e51-f6ae60f0ab27','สมศรี ผู้ปกครอง','PARENT','0819876543',NULL,1794527853925,1794527853925);
INSERT INTO `EmergencyContact` VALUES ('d15601e5-d98e-4bdd-93a5-18bec858bd75','15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','สมศรี ผู้ปกครอง','PARENT','0819876543',NULL,1794546945122,1794546945122);
INSERT INTO `EmergencyContact` VALUES ('6e84ed94-05f4-4fef-89ae-5e66405234de','34792186-3a68-4d4e-947a-eb4c9ae56037','ป้าเพ็ญ วงศ์สว่าง','SPOUSE','0864445566',NULL,1794547923454,1794547923454);
INSERT INTO `EmergencyContact` VALUES ('ed26dfa1-1644-4c95-b6c8-f522aa8144a3','6759377d-a89d-4215-b620-37518e21f793','สมศรี ผู้ปกครอง','PARENT','0819876543',NULL,1794548254895,1794548254895);
INSERT INTO `EmergencyContact` VALUES ('f8e7671b-606b-4bbe-b4f6-7a422d752332','d217e283-fb16-42d2-83c2-5ffe73472a51','สมศรี ผู้ปกครอง','PARENT','0819876543',NULL,1794548389705,1794548389705);
INSERT INTO `HostPayout` VALUES ('66c05dce-d84a-423a-88bc-313d900560c4','fbd920b6-ae2d-4e5d-bdf3-a11a89ce3e6c','34792186-3a68-4d4e-947a-eb4c9ae56037',3600.0,'TRANSFERRED','https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',1794548223050,1794548223051,1794548223051);
INSERT INTO `Message` VALUES ('769413d7-35ad-4997-8d6f-38f5df5d5a6f','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','สวัสดีค่ะทุกคน! ยินดีต้อนรับสู่ทริปดอยอินทนนท์นะคะ เตรียมเสื้อกันหนาวหนาๆ มาด้วยน้า',NULL,1794548223029);
INSERT INTO `Message` VALUES ('64f8406a-7ae8-4164-b529-93319b5c334f','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','94114f76-974d-49e1-a659-1b102ed1832b','สวัสดีครับใบเฟิร์น พร้อมออกเดินทางครับ เดี๋ยวเจอกันที่จุดนัดพบสนามบินเชียงใหม่ครับ',NULL,1794548223033);
INSERT INTO `Payment` VALUES ('60c05cf2-7fdf-41ad-b128-0333f6c27a7e','94114f76-974d-49e1-a659-1b102ed1832b','58b5b660-8a0b-4d66-a1c3-7efa7a774d06',950.0,50.0,900.0,'SUCCESS','SANDBOX-TG-DEMO-001',1794548223055,1794548223055);
INSERT INTO `Profile` VALUES ('06bc53ed-e730-4d0f-8461-8ec91db1fa7a','94114f76-974d-49e1-a659-1b102ed1832b','ผู้ดูแลระบบ Together Go','Admin','0812345678',NULL,NULL,'บัญชีผู้ดูแลระบบหลักของ Together Go',NULL,NULL,1794525213115,1794525213115);
INSERT INTO `Profile` VALUES ('c167ec20-c378-4999-9dc2-8181bfabf46d','d324dd34-73fe-402f-b0c0-2394f40e9b30','สมชาย นักผจญภัย','ชาย','0891234567','MALE',NULL,'ชอบปีนเขา ถ่ายรูป ท่องเที่ยวแบบเป็นมิตร',NULL,NULL,1794525925430,1794525925430);
INSERT INTO `Profile` VALUES ('1f17524e-ca49-41aa-8d4d-0d25db46e524','17364f30-a12a-412f-a3d0-e67bdf5cc21a','สมชาย นักผจญภัย','ชาย','0891234567','MALE',NULL,'ชอบปีนเขา ถ่ายรูป ท่องเที่ยวแบบเป็นมิตร',NULL,NULL,1794525958234,1794525958234);
INSERT INTO `Profile` VALUES ('de68fbb8-9111-425f-9615-33e2209607e4','f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','สมชาย ใจดี','สมชาย','0912345678','MALE',1159142400000,'ชอบเที่ยวทะเล รักสัตว์ เฟรนลี่',NULL,'1-XXXX-XXXXX-11-1',1794526623802,1794526661191);
INSERT INTO `Profile` VALUES ('aa4d21c0-2c60-4ba2-ac0e-ea96d423aa68','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','พิมพ์มาดา รัตนกุล','ใบเฟิร์น','0895551234','FEMALE',NULL,'รักการเดินทาง ชอบเดินป่า ถ่ายรูปกล้องฟิล์ม ชิลๆ เป็นกันเองมากค่ะ',NULL,NULL,1794527430082,1794527430082);
INSERT INTO `Profile` VALUES ('4235ff49-fd76-43e3-9508-c32e7e7f04e9','f86d4613-56e2-401f-9e51-f6ae60f0ab27','สมชาย นักผจญภัย','ชาย','0891234567','MALE',NULL,'ชอบปีนเขา ถ่ายรูป ท่องเที่ยวแบบเป็นมิตร',NULL,NULL,1794527853922,1794527853922);
INSERT INTO `Profile` VALUES ('adf4a99a-8d19-48f7-85cb-e47af1dc1752','15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','สมชาย นักผจญภัย','ชาย','0891234567','MALE',NULL,'ชอบปีนเขา ถ่ายรูป ท่องเที่ยวแบบเป็นมิตร',NULL,NULL,1794546945118,1794546945118);
INSERT INTO `Profile` VALUES ('8838f694-621e-4b0d-b396-e9439688b66d','34792186-3a68-4d4e-947a-eb4c9ae56037','สมชาย วงศ์สว่าง','น้าชาย','0861112233',NULL,NULL,'เจ้าของโฮมสเตย์และที่พักธรรมชาติ ยินดีต้อนรับนักเดินทางทุกท่านครับ',NULL,NULL,1794547923454,1794547923454);
INSERT INTO `Profile` VALUES ('9eb48d71-1640-4bfb-b34a-517c68ee04fd','28a85a3c-36a9-4d5f-a601-392196d0b616','กรณ์ สิทธิโชค','กรณ์','0823456789',NULL,NULL,'เจ้าหน้าที่ฝ่ายตรวจสอบความปลอดภัยและประสานงาน Together Go',NULL,NULL,1794547923461,1794547923461);
INSERT INTO `Profile` VALUES ('253d4cd9-5f74-4e1e-8dc6-94c0edd793ee','6759377d-a89d-4215-b620-37518e21f793','สมชาย นักผจญภัย','ชาย','0891234567','MALE',NULL,'ชอบปีนเขา ถ่ายรูป ท่องเที่ยวแบบเป็นมิตร',NULL,NULL,1794548254891,1794548254891);
INSERT INTO `Profile` VALUES ('ee5b741f-e84a-40fd-aa2e-5a542c76ef63','d217e283-fb16-42d2-83c2-5ffe73472a51','สมชาย นักผจญภัย','ชาย','0891234567','MALE',NULL,'ชอบปีนเขา ถ่ายรูป ท่องเที่ยวแบบเป็นมิตร',NULL,NULL,1794548389701,1794548389701);
INSERT INTO `Rating` VALUES ('305b66f7-42e3-4399-9f51-fd82f6f4a946','94114f76-974d-49e1-a659-1b102ed1832b','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','DRIVER',5,'ขับรถนุ่มนวลมาก ระมัดระวังตลอดทาง สุภาพ เป็นกันเองสุดๆ',1794548223040);
INSERT INTO `Rating` VALUES ('b76c8580-bbcf-49f2-99e4-3d5e5d3c9d0c','94114f76-974d-49e1-a659-1b102ed1832b','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','MEMBER',5,'เป็นเพื่อนร่วมทริปที่น่ารักมาก วางแผนละเอียด ถ่ายรูปสวยมากครับ',1794548223044);
INSERT INTO `ScreeningAttempt` VALUES ('eec59ff1-b2b5-4209-9cae-20d9b4f792ea','d324dd34-73fe-402f-b0c0-2394f40e9b30','[0,1,0,1,0,1,0,0,0]',3,27,'LOW','PASSED',1794785125451,NULL,NULL,1794525925452);
INSERT INTO `ScreeningAttempt` VALUES ('406eae8b-8276-4593-bdc9-6916f4bec089','17364f30-a12a-412f-a3d0-e67bdf5cc21a','[0,1,0,1,0,1,0,0,0]',3,27,'LOW','PASSED',1794785158254,NULL,NULL,1794525958255);
INSERT INTO `ScreeningAttempt` VALUES ('b5b221dc-c098-42b1-86ad-53afb6fc703e','f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','[1,0,1,1,1,1,1,1,1]',8,27,'LOW','PASSED',1794785896548,NULL,NULL,1794526696549);
INSERT INTO `ScreeningAttempt` VALUES ('8732099e-a9db-4175-8897-554a8998c872','f86d4613-56e2-401f-9e51-f6ae60f0ab27','[0,1,0,1,0,1,0,0,0]',3,27,'LOW','PASSED',1794787053942,NULL,NULL,1794527853943);
INSERT INTO `ScreeningAttempt` VALUES ('5d12e57c-61cb-43da-91dd-97e43605083b','15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','[0,1,0,1,0,1,0,0,0]',3,27,'LOW','PASSED',1794806145139,NULL,NULL,1794546945140);
INSERT INTO `ScreeningAttempt` VALUES ('4a05c0dc-29c7-424d-8cef-502e70ce675a','6759377d-a89d-4215-b620-37518e21f793','[0,1,0,1,0,1,0,0,0]',3,27,'LOW','PASSED',1794807454912,NULL,NULL,1794548254913);
INSERT INTO `ScreeningAttempt` VALUES ('c732d891-abd0-4b0f-b8d5-a4ed2a53777e','d217e283-fb16-42d2-83c2-5ffe73472a51','[0,1,0,1,0,1,0,0,0]',3,27,'LOW','PASSED',1794807589724,NULL,NULL,1794548389725);
INSERT INTO `StaffAssignment` VALUES ('ddf5a633-5725-4cfe-8c5f-a3f84bd8318e','28a85a3c-36a9-4d5f-a601-392196d0b616','admin','[`VERIFY_ID`,`VERIFY_SCREENING`,`MANAGE_ACCOMMODATION`,`HANDLE_EMERGENCY`]',1794547923465,1794547923465);
INSERT INTO `Trip` VALUES ('58b5b660-8a0b-4d66-a1c3-7efa7a774d06','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','8f50c1a0-04a0-4039-aec2-deaf41e85577','กอดหมอกหน้าหนาว ดอยอินทนนท์-แม่แจ่ม 3 วัน 2 คืน','ทริปชวนเพื่อนใหม่ไปสัมผัสอากาศหนาว ดูพระอาทิตย์ขึ้นที่กิ่วแม่ปาน ชมนาขั้นบันไดแม่แจ่ม กินหมูกระทะบนยอดดอย เน้นเที่ยวชิลๆ ถ่ายรูปสวย ไม่เร่งรีบ มีรถยนต์ส่วนตัวพร้อมเดินทาง','เชียงใหม่','https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1200&q=80',1796428800000,1796601600000,4,320.0,36.5,11680.0,'OPEN',1794527430105,1794527430105);
INSERT INTO `Trip` VALUES ('edea250f-835b-4946-8fec-4e3013865c6a','94114f76-974d-49e1-a659-1b102ed1832b','49d2ddd0-7fbf-47ec-a4b2-dfc53fb48203','ดำน้ำดูปะการัง อ่าวนาง-เกาะพีพี 4 วัน 3 คืน','ทริปทะเลรับลมร้อน ดำน้ำตื้นดูปะการัง เกาะพีพีดอน พีพีเล อ่าวมาหยา ถ่ายรูปกับเรือหัวโทง พักรีสอร์ทสบายๆ ริมหาดอ่าวนาง หารค่าใช้จ่ายเท่ากันทุกคน มีคนท้องถิ่นช่วยแนะนำจุดดำน้ำลับ','กระบี่','https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',1797292800000,1797552000000,6,180.0,38.0,6840.0,'OPEN',1794527430109,1794527430109);
INSERT INTO `Trip` VALUES ('389e05e3-71af-4ca8-bd2e-329c8eb38076','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','726f5ab9-6dbc-4d36-a094-5d4bbc33bd8c','แคมป์ปิ้งล่องแพ แม่น้ำแคว กาญจนบุรี 2 วัน 1 คืน','หนีความวุ่นวายไปนอนแพริมน้ำแคว โดดน้ำ ลอยคอ ล่องแพเปียก ตกค่ำปิ้งบาร์บีคิวดูดาว คุยกันรอบกองไฟ ชวนทุกคนที่อยากพักผ่อนใกล้ชิดธรรมชาติ','กาญจนบุรี','https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1200&q=80',1795824000000,1795910400000,4,260.0,35.0,9100.0,'OPEN',1794527430113,1794527430113);
INSERT INTO `Trip` VALUES ('a333b2da-cee9-45f8-87e5-4bc8742aadcf','94114f76-974d-49e1-a659-1b102ed1832b','b71482c9-a120-46a8-b726-268d96669941','Slow Life ชมทุ่งนาและขุนเขา เมืองปัว-บ่อเกลือ น่าน 3 วัน 2 คืน','สัมผัสเสน่ห์เมืองน่าน แวะร้านกาแฟกลางทุ่งนา ขับรถชมถนนลอยฟ้าหมายเลข 3 สูดโอโซนให้เต็มปอด และแวะชมกรรมวิธีต้มเกลือสินเธาว์โบราณที่บ่อเกลือ','น่าน','https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',1799539200000,1799712000000,4,450.0,37.0,16650.0,'OPEN',1794527430119,1794527430119);
INSERT INTO `Trip` VALUES ('8e5b5543-de9b-4c07-acb8-19f1adb52082','94114f76-974d-49e1-a659-1b102ed1832b',NULL,'ทริปทดสอบ Phase 2 อู่ทอง-สุพรรณบุรี','ทริปไหว้พระ ชมธรรมชาติริมอ่างเก็บน้ำ','สุพรรณบุรี',NULL,1797724800000,1797897600000,4,220.0,36.0,7920.0,'OPEN',1794527849500,1794527849500);
INSERT INTO `Trip` VALUES ('5da9056b-17f0-4c90-bcfd-ed82a5562e92','94114f76-974d-49e1-a659-1b102ed1832b',NULL,'ทริปทดสอบ Phase 2 อู่ทอง-สุพรรณบุรี','ทริปไหว้พระ ชมธรรมชาติริมอ่างเก็บน้ำ','สุพรรณบุรี',NULL,1797724800000,1797897600000,4,220.0,36.0,7920.0,'OPEN',1794527854216,1794527854216);
INSERT INTO `Trip` VALUES ('aa52c87b-4dfc-42c7-aff3-848d2f122752','94114f76-974d-49e1-a659-1b102ed1832b',NULL,'ทริปทดสอบ Phase 2 อู่ทอง-สุพรรณบุรี','ทริปไหว้พระ ชมธรรมชาติริมอ่างเก็บน้ำ','สุพรรณบุรี',NULL,1797724800000,1797897600000,4,220.0,36.0,7920.0,'OPEN',1794546945427,1794546945427);
INSERT INTO `Trip` VALUES ('9b5f6039-92a3-40dd-9dea-f3370b588335','94114f76-974d-49e1-a659-1b102ed1832b',NULL,'ทริปทดสอบ Phase 2 อู่ทอง-สุพรรณบุรี','ทริปไหว้พระ ชมธรรมชาติริมอ่างเก็บน้ำ','สุพรรณบุรี',NULL,1797724800000,1797897600000,4,220.0,36.0,7920.0,'OPEN',1794548255194,1794548255194);
INSERT INTO `Trip` VALUES ('c957e58c-6636-411c-a206-2f416bad5b36','94114f76-974d-49e1-a659-1b102ed1832b',NULL,'ทริปทดสอบ Phase 2 อู่ทอง-สุพรรณบุรี','ทริปไหว้พระ ชมธรรมชาติริมอ่างเก็บน้ำ','สุพรรณบุรี',NULL,1797724800000,1797897600000,4,220.0,36.0,7920.0,'OPEN',1794548390009,1794548390009);
INSERT INTO `TripMember` VALUES ('156f0768-4eab-4bcd-a023-40aa334a47ec','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','APPROVED',1794527430105);
INSERT INTO `TripMember` VALUES ('5f6f9d98-fbae-40c6-8856-28b07384e04f','edea250f-835b-4946-8fec-4e3013865c6a','94114f76-974d-49e1-a659-1b102ed1832b','APPROVED',1794527430109);
INSERT INTO `TripMember` VALUES ('5f4afb25-6740-4bd2-9903-b89b73d133d9','edea250f-835b-4946-8fec-4e3013865c6a','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','APPROVED',1794527430109);
INSERT INTO `TripMember` VALUES ('b542798e-9e18-4970-a00f-386990b2c4e8','389e05e3-71af-4ca8-bd2e-329c8eb38076','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','APPROVED',1794527430113);
INSERT INTO `TripMember` VALUES ('564377ff-143b-48a2-93f7-0a56c29bc42e','a333b2da-cee9-45f8-87e5-4bc8742aadcf','94114f76-974d-49e1-a659-1b102ed1832b','APPROVED',1794527430119);
INSERT INTO `TripMember` VALUES ('63ecddc4-024d-4a17-8404-3895b151a792','8e5b5543-de9b-4c07-acb8-19f1adb52082','94114f76-974d-49e1-a659-1b102ed1832b','APPROVED',1794527849500);
INSERT INTO `TripMember` VALUES ('07ee927e-6c86-4529-ba63-6baf2bdd10ec','8e5b5543-de9b-4c07-acb8-19f1adb52082','3cb6cfa9-0b50-4bf8-b587-9d0b8d91aaf0','APPROVED',1794527849508);
INSERT INTO `TripMember` VALUES ('68b11ae8-0159-4217-b133-02d7a4279c74','8e5b5543-de9b-4c07-acb8-19f1adb52082','8ba5d296-85d7-4ace-9ea7-989069af6eca','APPROVED',1794527849529);
INSERT INTO `TripMember` VALUES ('e5bfcc00-1842-4f0d-882e-0165cc2bc517','5da9056b-17f0-4c90-bcfd-ed82a5562e92','94114f76-974d-49e1-a659-1b102ed1832b','APPROVED',1794527854216);
INSERT INTO `TripMember` VALUES ('edcf907f-94f8-457d-9103-87f3a8862d6a','5da9056b-17f0-4c90-bcfd-ed82a5562e92','88419a8d-1ea8-45df-a1f0-6afd2a62ff8c','APPROVED',1794527854225);
INSERT INTO `TripMember` VALUES ('35e77974-ca53-4bb4-863a-bc759e065069','5da9056b-17f0-4c90-bcfd-ed82a5562e92','e4ff8483-c655-42a1-9b8b-9e3252749611','APPROVED',1794527854247);
INSERT INTO `TripMember` VALUES ('c5245d75-af08-44e9-b437-32dabf63c311','aa52c87b-4dfc-42c7-aff3-848d2f122752','94114f76-974d-49e1-a659-1b102ed1832b','APPROVED',1794546945427);
INSERT INTO `TripMember` VALUES ('642305c0-efc9-475e-a7b1-3746a9fd1bef','aa52c87b-4dfc-42c7-aff3-848d2f122752','930a596b-8413-4036-8ad2-d9c99aa310b5','APPROVED',1794546945436);
INSERT INTO `TripMember` VALUES ('1affdf03-36df-4ac3-99a0-8796677084c9','aa52c87b-4dfc-42c7-aff3-848d2f122752','2ff4994a-b5ab-4b33-ba8a-3b44b2fe6dda','APPROVED',1794546945458);
INSERT INTO `TripMember` VALUES ('c2923c5c-b891-4c40-9270-e3cb0ab150c3','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','94114f76-974d-49e1-a659-1b102ed1832b','PAID',1794548223018);
INSERT INTO `TripMember` VALUES ('ff56d5df-4ccc-4a24-9b50-4087a44f6c2f','9b5f6039-92a3-40dd-9dea-f3370b588335','94114f76-974d-49e1-a659-1b102ed1832b','APPROVED',1794548255194);
INSERT INTO `TripMember` VALUES ('da6dca93-d5e2-4c5d-b2cd-620a943cd835','9b5f6039-92a3-40dd-9dea-f3370b588335','198b4db5-450e-47b6-ae9d-d37c5acd3d7d','APPROVED',1794548255202);
INSERT INTO `TripMember` VALUES ('d16d31f6-ea92-45b9-88c9-d7acb9fee0f0','9b5f6039-92a3-40dd-9dea-f3370b588335','ab74a8c3-f2ba-4047-b2a1-fbf8fdee7c62','APPROVED',1794548255223);
INSERT INTO `TripMember` VALUES ('5e781178-d267-49aa-a0ce-b6936ef16d36','c957e58c-6636-411c-a206-2f416bad5b36','94114f76-974d-49e1-a659-1b102ed1832b','APPROVED',1794548390009);
INSERT INTO `TripMember` VALUES ('1e3d1703-309f-4877-9c16-493e2bf0ada2','c957e58c-6636-411c-a206-2f416bad5b36','621bd105-b237-4a22-9533-e38559e7d04c','APPROVED',1794548390017);
INSERT INTO `TripMember` VALUES ('d19ab3ee-94f9-43f6-9779-22120230f9d4','c957e58c-6636-411c-a206-2f416bad5b36','889dc97c-2455-49c7-938b-4027fd71fe5b','APPROVED',1794548390040);
INSERT INTO `TripRole` VALUES ('ca0736d0-a5c5-487b-b3e7-aab55bc7eb5f','58b5b660-8a0b-4d66-a1c3-7efa7a774d06','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','ไกด์นำทาง','วางแผนเส้นทางและจุดถ่ายรูปสวยๆ',1794527430105);
INSERT INTO `TripRole` VALUES ('7947cfc4-2116-450d-aa71-fd018c0e0346','58b5b660-8a0b-4d66-a1c3-7efa7a774d06',NULL,'ดูแลที่พัก','ประสานงานเช็คอิน-เช็คเอาท์ที่พัก',1794527430105);
INSERT INTO `TripRole` VALUES ('f9490c20-5400-42c7-9934-e9c1da0be0a5','58b5b660-8a0b-4d66-a1c3-7efa7a774d06',NULL,'จัดหาเสบียง/ร้านอาหาร','เลือกร้านเด็ดและจัดเตรียมเครื่องดื่ม',1794527430105);
INSERT INTO `TripRole` VALUES ('fe66c339-5c21-498b-90d8-0b558c3a3514','58b5b660-8a0b-4d66-a1c3-7efa7a774d06',NULL,'คนขับรถ','คนขับหลักของทริป ปลอดภัย มีใบขับขี่',1794527430105);
INSERT INTO `TripRole` VALUES ('3cc4be70-bbbc-47e4-8a68-b4d293683b44','edea250f-835b-4946-8fec-4e3013865c6a','94114f76-974d-49e1-a659-1b102ed1832b','ไกด์นำทาง','นำทางและประสานเรือนำเที่ยว',1794527430109);
INSERT INTO `TripRole` VALUES ('ad5ebcca-0c08-4a5f-9422-4c84e5592927','edea250f-835b-4946-8fec-4e3013865c6a',NULL,'ดูแลที่พัก','ดูแลความเรียบร้อยและกุญแจห้องพัก',1794527430109);
INSERT INTO `TripRole` VALUES ('2284e536-6c54-49cf-ac34-b2c7cf7e5813','edea250f-835b-4946-8fec-4e3013865c6a',NULL,'จัดหาเสบียง/ร้านอาหาร','หาร้านอาหารทะเลอร่อยราคาคนท้องถิ่น',1794527430109);
INSERT INTO `TripRole` VALUES ('37750660-cb19-4bc9-910f-fc1260372358','edea250f-835b-4946-8fec-4e3013865c6a','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','คนขับรถ','ขับรถรับ-ส่งสนามบินกระบี่',1794527430109);
INSERT INTO `TripRole` VALUES ('9818a938-95fb-41a4-90d7-71417523e20e','389e05e3-71af-4ca8-bd2e-329c8eb38076',NULL,'ไกด์นำทาง','ผู้นำทางทริป',1794527430113);
INSERT INTO `TripRole` VALUES ('87246e41-1075-4993-b090-61d0034d1aa5','389e05e3-71af-4ca8-bd2e-329c8eb38076',NULL,'ดูแลที่พัก','ดูแลการเช็คอินแพพัก',1794527430113);
INSERT INTO `TripRole` VALUES ('74fbd169-0e02-4fd9-88c0-8f3efae2493b','389e05e3-71af-4ca8-bd2e-329c8eb38076','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','จัดหาเสบียง/ร้านอาหาร','เตรียมอาหารเย็นและเตาปิ้งย่าง',1794527430113);
INSERT INTO `TripRole` VALUES ('f5f85224-571c-407e-b3d9-b597e5ed6e6a','389e05e3-71af-4ca8-bd2e-329c8eb38076',NULL,'คนขับรถ','ขับรถเส้นทางกาญจนบุรี',1794527430113);
INSERT INTO `TripRole` VALUES ('f6d7b982-c822-4555-8bc2-d21af396c307','a333b2da-cee9-45f8-87e5-4bc8742aadcf',NULL,'ไกด์นำทาง','นำเที่ยวจุดสำคัญในเมืองปัว',1794527430119);
INSERT INTO `TripRole` VALUES ('c95c2f8c-c4af-499d-bce2-a512df8be8b7','a333b2da-cee9-45f8-87e5-4bc8742aadcf',NULL,'ดูแลที่พัก','ประสานงานโฮมสเตย์',1794527430119);
INSERT INTO `TripRole` VALUES ('7f82934b-00c0-48fb-a6cb-5a8af27a0e11','a333b2da-cee9-45f8-87e5-4bc8742aadcf',NULL,'จัดหาเสบียง/ร้านอาหาร','หาร้านอาหารเหนือพื้นเมือง',1794527430119);
INSERT INTO `TripRole` VALUES ('4a079dd8-5265-45e6-9a64-a74e70546eb4','a333b2da-cee9-45f8-87e5-4bc8742aadcf','94114f76-974d-49e1-a659-1b102ed1832b','คนขับรถ','คนขับรถขึ้นเขาถนนลอยฟ้า',1794527430119);
INSERT INTO `TripRole` VALUES ('8486672c-52bf-491c-8281-8fe37e748b0c','8e5b5543-de9b-4c07-acb8-19f1adb52082','94114f76-974d-49e1-a659-1b102ed1832b','ไกด์นำทาง','นำทางทริป',1794527849500);
INSERT INTO `TripRole` VALUES ('b02d6648-2c77-42ea-836e-c32a3110fff7','8e5b5543-de9b-4c07-acb8-19f1adb52082',NULL,'ดูแลที่พัก','ดูแลกุญแจห้องพัก',1794527849500);
INSERT INTO `TripRole` VALUES ('c27e3eeb-af87-40f3-b8da-543b58b7c6ee','8e5b5543-de9b-4c07-acb8-19f1adb52082',NULL,'จัดหาเสบียง/ร้านอาหาร','จัดซื้อเสบียง',1794527849500);
INSERT INTO `TripRole` VALUES ('8365c3e4-9bfe-4f88-aa06-413b4cf741a0','8e5b5543-de9b-4c07-acb8-19f1adb52082',NULL,'คนขับรถ','คนขับหลัก',1794527849500);
INSERT INTO `TripRole` VALUES ('02f0972c-8fc6-457f-9396-3b4dce48533d','5da9056b-17f0-4c90-bcfd-ed82a5562e92','94114f76-974d-49e1-a659-1b102ed1832b','ไกด์นำทาง','นำทางทริป',1794527854216);
INSERT INTO `TripRole` VALUES ('755869d7-076d-4412-b62f-7bcdb5baa196','5da9056b-17f0-4c90-bcfd-ed82a5562e92',NULL,'ดูแลที่พัก','ดูแลกุญแจห้องพัก',1794527854216);
INSERT INTO `TripRole` VALUES ('bef615e4-a2e6-4493-adeb-8c1005cbda46','5da9056b-17f0-4c90-bcfd-ed82a5562e92',NULL,'จัดหาเสบียง/ร้านอาหาร','จัดซื้อเสบียง',1794527854216);
INSERT INTO `TripRole` VALUES ('550a81ca-4da7-48e2-ad05-c57e954f5686','5da9056b-17f0-4c90-bcfd-ed82a5562e92',NULL,'คนขับรถ','คนขับหลัก',1794527854216);
INSERT INTO `TripRole` VALUES ('52798c12-4a7b-40e8-9493-44a9bdbf690f','aa52c87b-4dfc-42c7-aff3-848d2f122752','94114f76-974d-49e1-a659-1b102ed1832b','ไกด์นำทาง','นำทางทริป',1794546945427);
INSERT INTO `TripRole` VALUES ('0771a447-4bcd-4e32-8dcd-7850c79ba20f','aa52c87b-4dfc-42c7-aff3-848d2f122752',NULL,'ดูแลที่พัก','ดูแลกุญแจห้องพัก',1794546945427);
INSERT INTO `TripRole` VALUES ('4caf4539-5f9c-4756-b651-6fb2600c37ac','aa52c87b-4dfc-42c7-aff3-848d2f122752',NULL,'จัดหาเสบียง/ร้านอาหาร','จัดซื้อเสบียง',1794546945427);
INSERT INTO `TripRole` VALUES ('593b750e-6671-4046-91bc-2d07195e1a9c','aa52c87b-4dfc-42c7-aff3-848d2f122752',NULL,'คนขับรถ','คนขับหลัก',1794546945427);
INSERT INTO `TripRole` VALUES ('87e93080-cc44-4013-a3b9-11c07f1313e9','9b5f6039-92a3-40dd-9dea-f3370b588335','94114f76-974d-49e1-a659-1b102ed1832b','ไกด์นำทาง','นำทางทริป',1794548255194);
INSERT INTO `TripRole` VALUES ('e0364094-61e5-4112-a086-30a9f73e2616','9b5f6039-92a3-40dd-9dea-f3370b588335',NULL,'ดูแลที่พัก','ดูแลกุญแจห้องพัก',1794548255194);
INSERT INTO `TripRole` VALUES ('490a8f12-b40a-458e-b187-0e9ad6cac97d','9b5f6039-92a3-40dd-9dea-f3370b588335',NULL,'จัดหาเสบียง/ร้านอาหาร','จัดซื้อเสบียง',1794548255194);
INSERT INTO `TripRole` VALUES ('ab5053c1-dbc5-4425-8a31-95d3a6bfdcd0','9b5f6039-92a3-40dd-9dea-f3370b588335',NULL,'คนขับรถ','คนขับหลัก',1794548255194);
INSERT INTO `TripRole` VALUES ('aeff23fc-52d8-4cd7-ac82-b073ec02691f','c957e58c-6636-411c-a206-2f416bad5b36','94114f76-974d-49e1-a659-1b102ed1832b','ไกด์นำทาง','นำทางทริป',1794548390009);
INSERT INTO `TripRole` VALUES ('7803dc83-b985-46fe-963d-eb3bc053a8b3','c957e58c-6636-411c-a206-2f416bad5b36',NULL,'ดูแลที่พัก','ดูแลกุญแจห้องพัก',1794548390009);
INSERT INTO `TripRole` VALUES ('1a7cd510-3918-48c7-8037-46f933a78fad','c957e58c-6636-411c-a206-2f416bad5b36',NULL,'จัดหาเสบียง/ร้านอาหาร','จัดซื้อเสบียง',1794548390009);
INSERT INTO `TripRole` VALUES ('4198d588-37ca-453b-9b84-b6cbdd2048fa','c957e58c-6636-411c-a206-2f416bad5b36',NULL,'คนขับรถ','คนขับหลัก',1794548390009);
INSERT INTO `User` VALUES ('94114f76-974d-49e1-a659-1b102ed1832b','admin@togethergo.com','admin','$2b$10$Sw.9UUjzJqhhOEHalgAb3uRZpY70d2VoxlNG2p8jZs2w8RChFRh16',1,'APPROVED','PASSED',5,1794525213115,1794526482295);
INSERT INTO `User` VALUES ('d324dd34-73fe-402f-b0c0-2394f40e9b30','traveler_1794525925369@example.com','traveler_1794525925369','$2b$10$AlLJEJrZulcur/lOFbc8WO4eR/BB/q6jmMVCeLS3IyW6b0DSkaofm',1,'APPROVED','PASSED',5,1794525925416,1794525925463);
INSERT INTO `User` VALUES ('17364f30-a12a-412f-a3d0-e67bdf5cc21a','traveler_1794525958172@example.com','traveler_1794525958172','$2b$10$YjvvRWUnURG9GhQDPezI4.RSsO0AlYkPYQO5KAKgNveE3sad9mJOe',1,'APPROVED','PASSED',5,1794525958219,1794525958265);
INSERT INTO `User` VALUES ('f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','somchai@example.om','somchai','$2b$10$511nArWf1bLzOo8cKbX4xOwcpCxUqwfpOixCEvn4.l.hjTFFALo7a',1,'APPROVED','PASSED',5,1794526401227,1794526739891);
INSERT INTO `User` VALUES ('777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','fern@togethergo.com','fern_traveler','$2b$10$VDRuqVK2so2y1wuINHu/FuRjeVE9umJ6wM/xLYi07mZAFMW9F312e',1,'APPROVED','PASSED',5,1794527430082,1794527430082);
INSERT INTO `User` VALUES ('3cb6cfa9-0b50-4bf8-b587-9d0b8d91aaf0','joiner_1794527849503@example.com','joiner_1794527849503','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794527849504,1794527849504);
INSERT INTO `User` VALUES ('8ba5d296-85d7-4ace-9ea7-989069af6eca','applicant_1794527849525@example.com','applicant_1794527849525','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794527849525,1794527849525);
INSERT INTO `User` VALUES ('f86d4613-56e2-401f-9e51-f6ae60f0ab27','traveler_1794527853861@example.com','traveler_1794527853861','$2b$10$XHonOiyNCXglPp1R5V9AieevBrx354Di.3EVUVOaGeEjfWTsL4Jou',1,'APPROVED','PASSED',5,1794527853908,1794527853954);
INSERT INTO `User` VALUES ('88419a8d-1ea8-45df-a1f0-6afd2a62ff8c','joiner_1794527854220@example.com','joiner_1794527854220','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794527854221,1794527854221);
INSERT INTO `User` VALUES ('e4ff8483-c655-42a1-9b8b-9e3252749611','applicant_1794527854243@example.com','applicant_1794527854243','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794527854244,1794527854244);
INSERT INTO `User` VALUES ('15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','traveler_1794546945056@example.com','traveler_1794546945056','$2b$10$eU2XQ8VdDwmBJhUZJZ3Kdu3XwYjhq0ozQyRrQXc7bSmHnlh6euEua',1,'APPROVED','PASSED',5,1794546945103,1794546945150);
INSERT INTO `User` VALUES ('930a596b-8413-4036-8ad2-d9c99aa310b5','joiner_1794546945431@example.com','joiner_1794546945431','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794546945432,1794546945432);
INSERT INTO `User` VALUES ('2ff4994a-b5ab-4b33-ba8a-3b44b2fe6dda','applicant_1794546945454@example.com','applicant_1794546945454','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794546945454,1794546945454);
INSERT INTO `User` VALUES ('34792186-3a68-4d4e-947a-eb4c9ae56037','host.somchai@togethergo.com','somchai_host','$2b$10$yLKQ5hmDdIEVtj/fP7yo2.aIYj8m.QOdjT050vG7CegRIoIn1FpTi',1,'APPROVED','PASSED',5,1794547923454,1794547923454);
INSERT INTO `User` VALUES ('28a85a3c-36a9-4d5f-a601-392196d0b616','staff.korn@togethergo.com','korn_staff','$2b$10$yLKQ5hmDdIEVtj/fP7yo2.aIYj8m.QOdjT050vG7CegRIoIn1FpTi',1,'APPROVED','PASSED',5,1794547923461,1794547923461);
INSERT INTO `User` VALUES ('6759377d-a89d-4215-b620-37518e21f793','traveler_1794548254831@example.com','traveler_1794548254831','$2b$10$ieG2.5MqT0o0.jMZ15sVeef8jMP/.rwJw6eH7vpFMPbxUdh8ruXOu',1,'APPROVED','PASSED',5,1794548254879,1794548254923);
INSERT INTO `User` VALUES ('198b4db5-450e-47b6-ae9d-d37c5acd3d7d','joiner_1794548255198@example.com','joiner_1794548255198','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794548255199,1794548255199);
INSERT INTO `User` VALUES ('ab74a8c3-f2ba-4047-b2a1-fbf8fdee7c62','applicant_1794548255219@example.com','applicant_1794548255219','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794548255220,1794548255220);
INSERT INTO `User` VALUES ('d217e283-fb16-42d2-83c2-5ffe73472a51','traveler_1794548389640@example.com','traveler_1794548389640','$2b$10$vPCqBpeCxIXhuDHqMaOr7ecO5ovmnWORw/8n/VMVGwu4sYzPTogpi',1,'APPROVED','PASSED',5,1794548389687,1794548389736);
INSERT INTO `User` VALUES ('621bd105-b237-4a22-9533-e38559e7d04c','joiner_1794548390013@example.com','joiner_1794548390013','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794548390014,1794548390014);
INSERT INTO `User` VALUES ('889dc97c-2455-49c7-938b-4027fd71fe5b','applicant_1794548390036@example.com','applicant_1794548390036','hash1234',1,'NOT_SUBMITTED','PASSED',5,1794548390037,1794548390037);
INSERT INTO `UserRole` VALUES ('2951df1c-161c-495c-b7be-9b4d5a54563a','94114f76-974d-49e1-a659-1b102ed1832b','ADMIN',1794525213115);
INSERT INTO `UserRole` VALUES ('f0b1aa6d-753a-4d05-a526-c46ba61d466b','94114f76-974d-49e1-a659-1b102ed1832b','STAFF',1794525213115);
INSERT INTO `UserRole` VALUES ('72713985-9cd6-4d3e-ab46-6cc48451dbc3','94114f76-974d-49e1-a659-1b102ed1832b','USER',1794525213115);
INSERT INTO `UserRole` VALUES ('7d4d25ed-f6f8-4faf-aeeb-9fbec64e3d8a','d324dd34-73fe-402f-b0c0-2394f40e9b30','USER',1794525925416);
INSERT INTO `UserRole` VALUES ('c165edf5-d89d-4b4f-8e3f-ac2a954eb9ab','17364f30-a12a-412f-a3d0-e67bdf5cc21a','USER',1794525958219);
INSERT INTO `UserRole` VALUES ('b76bcc7a-b71a-47d4-9727-c41eadc7f845','f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','USER',1794526401227);
INSERT INTO `UserRole` VALUES ('72e9b675-23f4-43a6-a2d3-aa6db68a719f','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','USER',1794527430082);
INSERT INTO `UserRole` VALUES ('525ed683-de47-4bd3-b1ce-5c19c3a43ab6','3cb6cfa9-0b50-4bf8-b587-9d0b8d91aaf0','USER',1794527849504);
INSERT INTO `UserRole` VALUES ('510f4f47-270e-43b8-a0dc-aed15eca0611','8ba5d296-85d7-4ace-9ea7-989069af6eca','USER',1794527849525);
INSERT INTO `UserRole` VALUES ('760a0fdb-61be-4f96-86a4-7a39bc822096','f86d4613-56e2-401f-9e51-f6ae60f0ab27','USER',1794527853908);
INSERT INTO `UserRole` VALUES ('482cdc92-680f-4e2b-b896-72981adcf420','88419a8d-1ea8-45df-a1f0-6afd2a62ff8c','USER',1794527854221);
INSERT INTO `UserRole` VALUES ('a45e247d-4730-4c13-b5ed-44f983e72ff2','e4ff8483-c655-42a1-9b8b-9e3252749611','USER',1794527854244);
INSERT INTO `UserRole` VALUES ('b069ee3d-3d65-4f2e-b401-dee3563a435f','15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','USER',1794546945103);
INSERT INTO `UserRole` VALUES ('75bf4e92-c790-4fce-863e-6afffb2eb5f3','930a596b-8413-4036-8ad2-d9c99aa310b5','USER',1794546945432);
INSERT INTO `UserRole` VALUES ('72b02d86-3351-4352-b083-6ba63645cc68','2ff4994a-b5ab-4b33-ba8a-3b44b2fe6dda','USER',1794546945454);
INSERT INTO `UserRole` VALUES ('57f03771-e390-4014-971d-27d21e09ea23','34792186-3a68-4d4e-947a-eb4c9ae56037','HOST',1794547923454);
INSERT INTO `UserRole` VALUES ('d2637dbf-cbf7-4fad-964d-1143ed8a267a','34792186-3a68-4d4e-947a-eb4c9ae56037','USER',1794547923454);
INSERT INTO `UserRole` VALUES ('86d4021f-5b2d-40e2-b3f0-e2414d10e443','28a85a3c-36a9-4d5f-a601-392196d0b616','STAFF',1794547923461);
INSERT INTO `UserRole` VALUES ('bd096b0b-5dd6-41cd-8f0b-6a76851438a5','28a85a3c-36a9-4d5f-a601-392196d0b616','USER',1794547923461);
INSERT INTO `UserRole` VALUES ('f5800cb4-b2db-4d70-9b35-d4d19f953d2e','6759377d-a89d-4215-b620-37518e21f793','USER',1794548254879);
INSERT INTO `UserRole` VALUES ('4a0b5d6f-64bb-495b-97cd-ec68e8e3c839','198b4db5-450e-47b6-ae9d-d37c5acd3d7d','USER',1794548255199);
INSERT INTO `UserRole` VALUES ('db88d9bb-3d4a-423a-b0c9-c37d033ac50c','ab74a8c3-f2ba-4047-b2a1-fbf8fdee7c62','USER',1794548255220);
INSERT INTO `UserRole` VALUES ('597a8e9e-ed9d-473f-ab83-f63bdf8b601e','d217e283-fb16-42d2-83c2-5ffe73472a51','USER',1794548389687);
INSERT INTO `UserRole` VALUES ('cfecebb9-0093-4663-b892-dbfaf9a9d3ff','621bd105-b237-4a22-9533-e38559e7d04c','USER',1794548390014);
INSERT INTO `UserRole` VALUES ('756e750c-7bc3-4cf5-9a96-f4e9d86878aa','889dc97c-2455-49c7-938b-4027fd71fe5b','USER',1794548390037);
INSERT INTO `VerificationDocument` VALUES ('e11ea1ad-7d68-4f4e-9568-6050e3bc055b','d324dd34-73fe-402f-b0c0-2394f40e9b30','IDCARD','/uploads/mock-idcard.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794525925441,1794525925459);
INSERT INTO `VerificationDocument` VALUES ('4f4bffaa-588e-4400-80a0-d3fae5d6cb6e','d324dd34-73fe-402f-b0c0-2394f40e9b30','SELFIE_WITH_IDCARD','/uploads/mock-selfie.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794525925444,1794525925459);
INSERT INTO `VerificationDocument` VALUES ('f6829f67-caa0-4dcf-910e-287468742316','17364f30-a12a-412f-a3d0-e67bdf5cc21a','IDCARD','/uploads/mock-idcard.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794525958244,1794525958262);
INSERT INTO `VerificationDocument` VALUES ('8611596f-879c-43d7-ab72-a442f6e609c7','17364f30-a12a-412f-a3d0-e67bdf5cc21a','SELFIE_WITH_IDCARD','/uploads/mock-selfie.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794525958248,1794525958262);
INSERT INTO `VerificationDocument` VALUES ('5dd4d7f2-5405-4734-bc46-6aa0cf9cd769','f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','IDCARD','/uploads/f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f_IDCARD_1794526661102_3c34894b.jpg',NULL,NULL,'APPROVED',NULL,'admin',1794526739899,1794526661202,1794526739900);
INSERT INTO `VerificationDocument` VALUES ('3006f171-4019-4692-a80b-fe265e7fc2a2','f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f','SELFIE_WITH_IDCARD','/uploads/f8e751e2-cdaf-4ea5-a738-ac3f4de9c98f_SELFIE_WITH_IDCARD_1794526661111_c492a9f0.jpg',NULL,NULL,'APPROVED',NULL,'admin',1794526739899,1794526661208,1794526739900);
INSERT INTO `VerificationDocument` VALUES ('74980ee7-bd18-4a89-a6b2-71eb8addf66b','f86d4613-56e2-401f-9e51-f6ae60f0ab27','IDCARD','/uploads/mock-idcard.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794527853932,1794527853950);
INSERT INTO `VerificationDocument` VALUES ('eb2eab36-543c-42ac-8223-d63571c3de66','f86d4613-56e2-401f-9e51-f6ae60f0ab27','SELFIE_WITH_IDCARD','/uploads/mock-selfie.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794527853936,1794527853950);
INSERT INTO `VerificationDocument` VALUES ('4a54b737-515c-4492-8e50-67b91f989020','15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','IDCARD','/uploads/mock-idcard.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794546945129,1794546945147);
INSERT INTO `VerificationDocument` VALUES ('d9812a13-4246-4c44-b876-7cdb8ed92ef2','15624bd3-4e5b-4e4b-a6c8-dfb47bb9c3ad','SELFIE_WITH_IDCARD','/uploads/mock-selfie.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794546945132,1794546945147);
INSERT INTO `VerificationDocument` VALUES ('ed545032-51bd-4fc0-a5a1-1c36a3977b8c','777e2c1e-e3cb-4833-a1de-4e439a3d1ba3','DRIVING_LICENSE','https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',NULL,NULL,'APPROVED',NULL,NULL,NULL,1794548154708,1794548154708);
INSERT INTO `VerificationDocument` VALUES ('a1fc30d1-33ae-4a03-8a0c-f5e672e35fa5','6759377d-a89d-4215-b620-37518e21f793','IDCARD','/uploads/mock-idcard.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794548254903,1794548254920);
INSERT INTO `VerificationDocument` VALUES ('1d7e539f-4a11-46fe-aacd-2a9089343586','6759377d-a89d-4215-b620-37518e21f793','SELFIE_WITH_IDCARD','/uploads/mock-selfie.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794548254906,1794548254920);
INSERT INTO `VerificationDocument` VALUES ('b284ffc3-5ad5-4cf2-aa3d-fd846df094b5','d217e283-fb16-42d2-83c2-5ffe73472a51','IDCARD','/uploads/mock-idcard.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794548389713,1794548389733);
INSERT INTO `VerificationDocument` VALUES ('ee590d6a-a85d-469f-bb74-a7b3af246743','d217e283-fb16-42d2-83c2-5ffe73472a51','SELFIE_WITH_IDCARD','/uploads/mock-selfie.jpg',NULL,NULL,'APPROVED',NULL,'admin',NULL,1794548389717,1794548389733);
CREATE UNIQUE INDEX IF NOT EXISTS `DriverVote_tripId_voterId_key` ON `DriverVote` (
	`tripId`,
	`voterId`
);
CREATE UNIQUE INDEX IF NOT EXISTS `Profile_userId_key` ON `Profile` (
	`userId`
);
CREATE UNIQUE INDEX IF NOT EXISTS `StaffAssignment_userId_key` ON `StaffAssignment` (
	`userId`
);
CREATE UNIQUE INDEX IF NOT EXISTS `TripMember_tripId_userId_key` ON `TripMember` (
	`tripId`,
	`userId`
);
CREATE UNIQUE INDEX IF NOT EXISTS `UserRole_userId_role_key` ON `UserRole` (
	`userId`,
	`role`
);
CREATE UNIQUE INDEX IF NOT EXISTS `User_email_key` ON `User` (
	`email`
);
CREATE UNIQUE INDEX IF NOT EXISTS `User_username_key` ON `User` (
	`username`
);
SET FOREIGN_KEY_CHECKS=1;