import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Together Go — เที่ยวด้วยกัน ปลอดภัย มั่นใจในทุกคน",
  description:
    "เว็บรวมคนแปลกหน้าที่ยืนยันตัวตนแล้ว มาสร้างทริปและเที่ยวด้วยกันแบบเพื่อน พร้อมระบบคัดกรองความปลอดภัยและหารค่าใช้จ่ายจริง",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-brand-bg text-brand-navy antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
