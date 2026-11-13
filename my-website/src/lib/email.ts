import { prisma } from "./prisma";

export type EmailEventType =
  | "IDENTITY_APPROVED"
  | "TRIP_JOIN_APPROVED"
  | "PAYMENT_SUCCESS"
  | "TRIP_REMINDER"
  | "BOOKING_CONFIRMED";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailEventData {
  recipient: EmailRecipient;
  eventType: EmailEventType;
  data?: Record<string, any>;
  relatedId?: string;
}

/**
 * Generate HTML email template for 5 core Together Go events
 */
export function generateEmailTemplate(
  eventType: EmailEventType,
  name: string,
  data: Record<string, any> = {}
): { subject: string; html: string } {
  const brandBlue = "#0F294A";
  const brandTeal = "#0D9488";
  const greeting = `สวัสดีคุณ ${name || "นักเดินทาง Together Go"},`;

  let subject = "";
  let bodyContent = "";

  switch (eventType) {
    case "IDENTITY_APPROVED":
      subject = "🎉 การยืนยันตัวตนของคุณได้รับการอนุมัติแล้ว — Together Go";
      bodyContent = `
        <h2 style="color: ${brandTeal}; margin-top: 0;">ยินดีด้วย! คุณได้รับการยืนยันตัวตนเรียบร้อยแล้ว</h2>
        <p>เจ้าหน้าที่ได้ตรวจสอบเอกสารบัตรประชาชนและข้อมูลของคุณเรียบร้อยแล้ว บัญชีของคุณได้รับป้าย <strong>"ยืนยันตัวตนแล้ว"</strong> และสามารถสร้างทริปหรือเข้าร่วมทริปท่องเที่ยวได้ทันที</p>
        <div style="background-color: #F0FDFA; border: 1px solid #99F6E4; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #115E59; font-weight: bold;">พร้อมออกเดินทางแล้วหรือยัง?</p>
          <p style="margin: 4px 0 0 0; color: #134E4A; font-size: 14px;">ค้นหาทริปที่ชอบแล้วส่งคำขอเข้าร่วมได้เลย</p>
        </div>
      `;
      break;

    case "TRIP_JOIN_APPROVED":
      subject = `✅ คำขอเข้าร่วมทริป "${data.tripTitle || "ทริปท่องเที่ยว"}" ได้รับการอนุมัติแล้ว`;
      bodyContent = `
        <h2 style="color: ${brandTeal}; margin-top: 0;">ผู้สร้างทริปอนุมัติคำขอของคุณแล้ว!</h2>
        <p>คำขอเข้าร่วมทริป <strong>"${data.tripTitle || "ทริป"}"</strong> ได้รับการอนุมัติเรียบร้อยแล้ว กรุณาดำเนินการชำระเงินส่วนแบ่งค่าที่พักและค่าธรรมเนียมเพื่อยืนยันที่นั่งของคุณ</p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748B;">ยอดที่ต้องชำระ:</p>
          <p style="margin: 4px 0; font-size: 24px; font-weight: bold; color: ${brandTeal};">฿${(data.amount || 0).toLocaleString()} THB</p>
          <p style="margin: 8px 0 0 0; font-size: 13px; color: #94A3B8;">(ค่าที่พักหารต่อคน + ค่าธรรมเนียมแพลตฟอร์ม)</p>
        </div>
        <p><a href="${data.paymentLink || "http://localhost:3000/my-trips"}" style="display: inline-block; background-color: ${brandTeal}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">ชำระเงินเพื่อยืนยันที่นั่ง</a></p>
      `;
      break;

    case "PAYMENT_SUCCESS":
      subject = `💳 ยืนยันการชำระเงินสำเร็จ — ทริป "${data.tripTitle || "ท่องเที่ยว"}"`;
      bodyContent = `
        <h2 style="color: #059669; margin-top: 0;">การชำระเงินเสร็จสมบูรณ์!</h2>
        <p>เราได้รับการชำระเงินของคุณสำหรับทริป <strong>"${data.tripTitle || "ทริป"}"</strong> เรียบร้อยแล้ว ตอนนี้คุณเป็นสมาชิกทริปอย่างเป็นทางการและสามารถเข้าห้องแชทกลุ่มได้ทันที</p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748B;">หมายเลขอ้างอิง:</td>
              <td style="padding: 6px 0; font-weight: bold; text-align: right;">${data.paymentRef || "PAY-" + Date.now()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">ยอดชำระสุทธิ:</td>
              <td style="padding: 6px 0; font-weight: bold; color: ${brandTeal}; text-align: right;">฿${(data.amount || 0).toLocaleString()} THB</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748B;">สถานะ:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #059669; text-align: right;">ชำระเงินแล้ว (PAID)</td>
            </tr>
          </table>
        </div>
        <p style="font-size: 13px; color: #64748B;">*กรณีต้องการยกเลิก จะได้รับคืนเฉพาะค่าที่พัก ค่าธรรมเนียมระบบไม่สามารถคืนได้</p>
      `;
      break;

    case "TRIP_REMINDER":
      subject = `⏰ แจ้งเตือน: ทริป "${data.tripTitle || "ท่องเที่ยว"}" ใกล้ถึงวันเดินทางแล้ว!`;
      bodyContent = `
        <h2 style="color: ${brandBlue}; margin-top: 0;">เตรียมกระเป๋าพร้อมหรือยัง? ทริปของคุณกำลังจะเริ่มแล้ว</h2>
        <p>ทริป <strong>"${data.tripTitle || "ทริปท่องเที่ยว"}"</strong> มีกำหนดเดินทางในวันที่ <strong>${data.startDate || "เร็วๆ นี้"}</strong></p>
        <div style="background-color: #FEF3C7; border: 1px solid #FCD34D; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #92400E; font-weight: bold;">สิ่งที่ควรเตรียมความพร้อม:</p>
          <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #78350F; font-size: 14px;">
            <li>ตรวจสอบจุดนัดพบในแชทกลุ่ม</li>
            <li>เตรียมสัมภาระและยาประจำตัว</li>
            <li>พักผ่อนให้เพียงพอก่อนวันเดินทาง</li>
          </ul>
        </div>
      `;
      break;

    case "BOOKING_CONFIRMED":
      subject = `🏡 ยืนยันการจองที่พักสำหรับทริป "${data.tripTitle || "ท่องเที่ยว"}" เรียบร้อยแล้ว`;
      bodyContent = `
        <h2 style="color: ${brandTeal}; margin-top: 0;">การจองที่พักได้รับการยืนยันแล้ว</h2>
        <p>ทีมงานได้ประสานงานและยืนยันการจองที่พัก <strong>"${data.accName || "ที่พักประจำทริป"}"</strong> ในจังหวัด <strong>${data.province || "-"}</strong> สำหรับทริปของคุณเรียบร้อยแล้ว</p>
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>ที่พัก:</strong> ${data.accName || "-"}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>วันเช็คอิน:</strong> ${data.checkIn || "-"}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>วันเช็คเอาท์:</strong> ${data.checkOut || "-"}</p>
          <p style="margin: 0; font-size: 14px; color: #059669; font-weight: bold;">สถานะ: จองแล้ว (BOOKED)</p>
        </div>
      `;
      break;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1E293B;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFC; padding: 24px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                <!-- Header -->
                <tr>
                  <td style="background-color: ${brandBlue}; padding: 24px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">
                      Together <span style="color: ${brandTeal};">Go</span>
                    </h1>
                    <p style="color: #94A3B8; margin: 4px 0 0 0; font-size: 12px;">เที่ยวด้วยกัน ปลอดภัย มั่นใจในทุกคน</p>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 32px 28px;">
                    <p style="font-size: 16px; font-weight: bold; margin-top: 0; margin-bottom: 16px;">${greeting}</p>
                    ${bodyContent}
                    <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 28px 0;" />
                    <p style="font-size: 13px; color: #64748B; margin: 0;">หากมีข้อสงสัยหรือต้องการความช่วยเหลือ สามารถตอบกลับอีเมลนี้หรือติดต่อทีมงานได้ตลอด 24 ชม.</p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F1F5F9; padding: 16px 28px; text-align: center; font-size: 12px; color: #94A3B8;">
                    <p style="margin: 0;">Together Go Platform © ${new Date().getFullYear()} • ระบบแจ้งเตือนอัตโนมัติ</p>
                    <p style="margin: 4px 0 0 0;">ศูนย์ความปลอดภัย: 191 | การแพทย์ฉุกเฉิน: 1669</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { subject, html };
}

/**
 * Send or log email notification
 */
export async function sendNotificationEmail(event: EmailEventData) {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });

    const senderDomain = settings?.emailSenderDomain || process.env.EMAIL_FROM || "noreply@togethergo.com";
    const { subject, html } = generateEmailTemplate(
      event.eventType,
      event.recipient.name || "นักเดินทาง",
      event.data
    );

    // Save to EmailLog table for instant preview & auditing
    const emailLog = await prisma.emailLog.create({
      data: {
        toEmail: event.recipient.email,
        toName: event.recipient.name || null,
        subject,
        eventType: event.eventType,
        bodyHtml: html,
        status: settings?.smtpEnabled ? "SENT" : "PREVIEW",
        relatedId: event.relatedId || null,
        sentAt: new Date(),
      },
    });

    console.log(`[Email Service] Logged ${event.eventType} to ${event.recipient.email} (sender: ${senderDomain}, id: ${emailLog.id})`);

    return {
      success: true,
      logId: emailLog.id,
      previewUrl: `/api/admin/emails/${emailLog.id}`,
    };
  } catch (error: any) {
    console.error("sendNotificationEmail error:", error);
    return { success: false, error: error.message };
  }
}
