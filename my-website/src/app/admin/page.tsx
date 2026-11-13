"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  MapPin,
  Settings,
  Users,
  Mail,
  ExternalLink,
  LifeBuoy,
  Plus,
} from "lucide-react";
import { VerifiedBadge } from "@/components/StatusBadges";

type AdminTab =
  | "overview"
  | "verify"
  | "screenings"
  | "accommodations"
  | "trips"
  | "emergencies"
  | "reports"
  | "refunds"
  | "payouts"
  | "emails"
  | "settings"
  | "staff";

export default function AdminDashboardPage() {
  const { user, loading, hasRole } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Data states
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [screeningsList, setScreeningsList] = useState<any[]>([]);
  const [accommodationsList, setAccommodationsList] = useState<any[]>([]);
  const [tripsList, setTripsList] = useState<any[]>([]);
  const [emergenciesList, setEmergenciesList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [refundsList, setRefundsList] = useState<any[]>([]);
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Modals / Preview
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [selectedEmailHtml, setSelectedEmailHtml] = useState<string | null>(null);
  const [actionProcessing, setActionProcessing] = useState<string | null>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    platformFeePerUser: "50",
    screeningThreshold: "9",
    screeningCooldownDays: "3",
    emailSenderDomain: "noreply@togethergo.com",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    smtpEnabled: false,
  });

  // New Accommodation Modal in Admin
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [accForm, setAccForm] = useState({
    name: "",
    description: "",
    province: "",
    address: "",
    pricePerNight: "1500",
    maxGuests: "6",
    imagesJson: "",
  });

  const isAdmin = hasRole("ADMIN");
  const isStaff = hasRole("STAFF");

  // Fetch functions
  const fetchAllData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [
        statsRes,
        usersRes,
        screeningsRes,
        accsRes,
        tripsRes,
        emergenciesRes,
        reportsRes,
        refundsRes,
        payoutsRes,
        emailsRes,
      ] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/screenings"),
        fetch("/api/admin/accommodations"),
        fetch("/api/admin/trips"),
        fetch("/api/admin/emergencies"),
        fetch("/api/admin/reports"),
        fetch("/api/admin/refunds"),
        fetch("/api/admin/payouts"),
        fetch("/api/admin/emails"),
      ]);

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (usersRes.ok) setUsersList((await usersRes.json()).users || []);
      if (screeningsRes.ok) setScreeningsList((await screeningsRes.json()).screenings || []);
      if (accsRes.ok) setAccommodationsList((await accsRes.json()).accommodations || []);
      if (tripsRes.ok) setTripsList((await tripsRes.json()).trips || []);
      if (emergenciesRes.ok) setEmergenciesList((await emergenciesRes.json()).alerts || []);
      if (reportsRes.ok) setReportsList((await reportsRes.json()).reports || []);
      if (refundsRes.ok) setRefundsList((await refundsRes.json()).payments || []);
      if (payoutsRes.ok) setPayoutsList((await payoutsRes.json()).payouts || []);
      if (emailsRes.ok) setEmailLogs((await emailsRes.json()).logs || []);

      if (isAdmin) {
        const [settingsRes, staffRes] = await Promise.all([
          fetch("/api/admin/settings"),
          fetch("/api/admin/staff"),
        ]);
        if (settingsRes.ok) {
          const s = (await settingsRes.json()).settings;
          setSettingsForm({
            platformFeePerUser: String(s.platformFeePerUser ?? 50),
            screeningThreshold: String(s.screeningThreshold ?? 9),
            screeningCooldownDays: String(s.screeningCooldownDays ?? 3),
            emailSenderDomain: s.emailSenderDomain || "noreply@togethergo.com",
            smtpHost: s.smtpHost || "",
            smtpPort: String(s.smtpPort || 587),
            smtpUser: s.smtpUser || "",
            smtpPass: s.smtpPass || "",
            smtpEnabled: Boolean(s.smtpEnabled),
          });
        }
        if (staffRes.ok) setStaffList((await staffRes.json()).staff || []);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoadingData(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth");
      } else if (!isAdmin && !isStaff) {
        router.push("/");
      } else {
        fetchAllData();
      }
    }
  }, [user, loading, isAdmin, isStaff, router, fetchAllData]);

  // Actions
  const handleVerifyAction = async (targetUserId: string, action: string, reason?: string) => {
    setActionProcessing(targetUserId);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, reason }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleScreeningAction = async (attemptId: string, action: string, notes?: string) => {
    setActionProcessing(attemptId);
    try {
      const res = await fetch("/api/admin/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, action, reviewNotes: notes }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleAccAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setActionProcessing(id);
    try {
      const res = await fetch("/api/admin/accommodations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleTripStatus = async (id: string, status: string) => {
    setActionProcessing(id);
    try {
      const res = await fetch("/api/admin/trips", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleEmergencyAction = async (id: string, status: "RESOLVED" | "ACTIVE") => {
    setActionProcessing(id);
    try {
      const res = await fetch("/api/admin/emergencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleReportAction = async (id: string, status: string, notes?: string) => {
    setActionProcessing(id);
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminNotes: notes }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleProcessRefund = async (paymentId: string) => {
    if (!confirm("ยืนยันดำเนินการคืนเงิน (คืนเฉพาะค่าที่พัก ไม่คืนค่าธรรมเนียม)?")) return;
    setActionProcessing(paymentId);
    try {
      const res = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handlePayoutTransfer = async (payoutId: string) => {
    const proofUrl = prompt(
      "กรุณาระบุลิงก์รูปภาพสลิปหลักฐานการโอน:",
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80"
    );
    if (!proofUrl) return;

    setActionProcessing(payoutId);
    try {
      const res = await fetch("/api/admin/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, transferProofUrl: proofUrl, status: "TRANSFERRED" }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionProcessing("settings");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsForm),
      });
      if (res.ok) {
        alert("บันทึกการตั้งค่าระบบสำเร็จ!");
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionProcessing(null);
    }
  };

  const handleGrantStaff = async (targetUsernameOrEmail: string) => {
    const target = usersList.find(
      (u) =>
        u.username.toLowerCase() === targetUsernameOrEmail.toLowerCase() ||
        u.email.toLowerCase() === targetUsernameOrEmail.toLowerCase()
    );
    if (!target) {
      alert("ไม่พบผู้ใช้งานที่ระบุ");
      return;
    }

    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: target.id, action: "GRANT" }),
      });
      if (res.ok) {
        alert("ให้สิทธิ์พนักงาน (Staff) สำเร็จ!");
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeStaff = async (targetUserId: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการถอนสิทธิ์พนักงานนี้?")) return;
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action: "REVOKE" }),
      });
      if (res.ok) await fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendTestEmail = async () => {
    try {
      const res = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "IDENTITY_APPROVED",
        }),
      });
      if (res.ok) {
        alert("สร้างอีเมลทดสอบเรียบร้อยแล้ว ตรวจสอบในรายการ Log ด้านล่าง");
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateAdminAcc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/accommodations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accForm),
      });
      if (res.ok) {
        setShowAddAccModal(false);
        setAccForm({
          name: "",
          description: "",
          province: "",
          address: "",
          pricePerNight: "1500",
          maxGuests: "6",
          imagesJson: "",
        });
        await fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">
              {t.admin.title}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isAdmin
                  ? "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  : "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              }`}
            >
              {isAdmin ? "Super Admin" : "Staff Member"}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? "จัดการระบบเต็มรูปแบบ: ภาพรวม ตรวจสอบ ตั้งค่า และสิทธิ์พนักงาน"
              : "พอร์ทัลเจ้าหน้าที่: ตรวจบัตรประชาชน/ใบขับขี่ ผลประเมิน และช่วยเหลือเหตุฉุกเฉิน"}
          </p>
        </div>

        <button
          onClick={fetchAllData}
          disabled={loadingData}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 shadow-2xs"
        >
          <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "overview"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.admin.overview}
        </button>

        <button
          onClick={() => setActiveTab("verify")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "verify"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>{t.admin.verifyId}</span>
          {stats?.pendingId > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("screenings")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "screenings"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <span>{t.admin.screening}</span>
          {stats?.pendingScreening > 0 && (
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("accommodations")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "accommodations"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.admin.accommodations}
        </button>

        <button
          onClick={() => setActiveTab("trips")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "trips"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.admin.trips}
        </button>

        <button
          onClick={() => setActiveTab("emergencies")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === "emergencies"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          }`}
        >
          <span>{t.admin.emergency}</span>
          {stats?.activeEmergencies > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-200 text-rose-800 text-[10px] font-bold">
              {stats.activeEmergencies}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("reports")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "reports"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.admin.reports}
        </button>

        <button
          onClick={() => setActiveTab("refunds")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "refunds"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.admin.refunds}
        </button>

        <button
          onClick={() => setActiveTab("payouts")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "payouts"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          โอนเงินที่พัก
        </button>

        <button
          onClick={() => setActiveTab("emails")}
          className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors ${
            activeTab === "emails"
              ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          {t.admin.emailLogs}
        </button>

        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "settings"
                  ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>{t.admin.settings}</span>
            </button>

            <button
              onClick={() => setActiveTab("staff")}
              className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "staff"
                  ? "bg-brand-navy dark:bg-brand-teal text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t.admin.staff}</span>
            </button>
          </>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t.admin.totalUsers}
              </p>
              <p className="text-3xl font-bold text-brand-navy dark:text-white mt-1">
                {stats?.totalUsers ?? 0}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                {t.admin.pendingId}
              </p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {stats?.pendingId ?? 0}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <p className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
                {t.admin.pendingScreening}
              </p>
              <p className="text-3xl font-bold text-sky-600 mt-1">
                {stats?.pendingScreening ?? 0}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
              <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                {t.admin.activeEmergencies}
              </p>
              <p className="text-3xl font-bold text-rose-600 mt-1">
                {stats?.activeEmergencies ?? 0}
              </p>
            </div>
          </div>

          {/* Revenue row - ADMIN ONLY */}
          {isAdmin && (
            <div className="p-6 rounded-3xl bg-linear-to-r from-brand-navy to-brand-navy-800 text-white shadow-soft grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-xs text-brand-teal-300 font-semibold uppercase tracking-wider">
                  รายได้ค่าธรรมเนียมรวม (Platform Revenue)
                </span>
                <p className="text-3xl font-bold mt-1 text-white">
                  ฿{(stats?.totalRevenue ?? 0).toLocaleString()} THB
                </p>
                <p className="text-xs text-slate-300 mt-1">
                  คำนวณจากค่าธรรมเนียมคงที่ต่อคน (฿{settingsForm.platformFeePerUser}/คน)
                </p>
              </div>

              <div>
                <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">
                  ยอดโอนให้ที่พักแล้ว (Host Payouts)
                </span>
                <p className="text-3xl font-bold mt-1 text-emerald-300">
                  ฿{(stats?.totalPayouts ?? 0).toLocaleString()} THB
                </p>
              </div>

              <div>
                <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
                  ทริปทั้งหมดในระบบ
                </span>
                <p className="text-3xl font-bold mt-1 text-white">
                  {stats?.totalTrips ?? 0} ทริป
                </p>
              </div>
            </div>
          )}

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <button
              onClick={() => setActiveTab("verify")}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-brand-teal transition-all shadow-soft"
            >
              <ShieldCheck className="w-6 h-6 text-brand-teal mb-2" />
              <h4 className="font-bold text-brand-navy dark:text-white">
                ตรวจบัตรประชาชน & ใบขับขี่
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                มี {stats?.pendingId ?? 0} คำขอรอบริการ
              </p>
            </button>

            <button
              onClick={() => setActiveTab("emergencies")}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-rose-500 transition-all shadow-soft"
            >
              <LifeBuoy className="w-6 h-6 text-rose-600 mb-2" />
              <h4 className="font-bold text-rose-600">
                แจ้งเหตุฉุกเฉิน SOS
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                มี {stats?.activeEmergencies ?? 0} เคสที่ยังไม่ปิด
              </p>
            </button>

            <button
              onClick={() => setActiveTab("emails")}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-left hover:border-brand-teal transition-all shadow-soft"
            >
              <Mail className="w-6 h-6 text-sky-600 mb-2" />
              <h4 className="font-bold text-brand-navy dark:text-white">
                ระบบอีเมลแจ้งเตือน
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                ดู Log และ Preview อีเมลทั้ง 5 เหตุการณ์
              </p>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFY ID & LICENSES */}
      {activeTab === "verify" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-navy dark:text-white">
              {t.admin.verifyId}
            </h2>
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ผู้ใช้งาน</th>
                    <th className="px-6 py-4">สถานะบัตร ปชช.</th>
                    <th className="px-6 py-4">เอกสารที่อัปโหลด</th>
                    <th className="px-6 py-4">ใบขับขี่ (Driver License)</th>
                    <th className="px-6 py-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList
                    .filter((u) =>
                      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      u.profile?.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((u) => {
                      const docs = u.verificationDocuments || [];
                      const licenseDoc = docs.find((d: any) => d.documentType === "DRIVING_LICENSE");
                      const isBusy = actionProcessing === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-brand-navy dark:text-white">
                              {u.profile?.fullName || u.username}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              @{u.username} • {u.email}
                            </div>
                            {u.profile?.phone && (
                              <div className="text-xs text-slate-600 dark:text-slate-400">
                                {u.profile.phone}
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <VerifiedBadge status={u.idCardStatus} size="sm" />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {docs
                                .filter((d: any) => d.documentType !== "DRIVING_LICENSE")
                                .map((doc: any) => (
                                  <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoc(doc.fileUrl)}
                                    className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline font-semibold"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>
                                      {doc.documentType === "IDCARD" ? "บัตรประชาชน" : "เซลฟี่"}
                                    </span>
                                  </button>
                                ))}
                              {docs.length === 0 && (
                                <span className="text-xs text-slate-400">ไม่มีเอกสาร</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            {licenseDoc ? (
                              <div className="space-y-1">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    licenseDoc.status === "APPROVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : licenseDoc.status === "REJECTED"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {licenseDoc.status}
                                </span>
                                <div>
                                  <button
                                    onClick={() => setSelectedDoc(licenseDoc.fileUrl)}
                                    className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline font-semibold"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>ดูรูปใบขับขี่</span>
                                  </button>
                                </div>
                                {licenseDoc.status === "PENDING" && (
                                  <div className="flex items-center gap-1 pt-1">
                                    <button
                                      disabled={isBusy}
                                      onClick={() => handleVerifyAction(u.id, "APPROVE_LICENSE")}
                                      className="px-2 py-0.5 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700"
                                    >
                                      อนุมัติใบขับขี่
                                    </button>
                                    <button
                                      disabled={isBusy}
                                      onClick={() => handleVerifyAction(u.id, "REJECT_LICENSE")}
                                      className="px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 rounded hover:bg-rose-100"
                                    >
                                      ปฏิเสธ
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">ไม่ได้อัปโหลด</span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right">
                            {u.idCardStatus === "PENDING" && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleVerifyAction(u.id, "APPROVE_ID")}
                                  className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                                >
                                  {t.admin.approveIdBtn}
                                </button>
                                <button
                                  disabled={isBusy}
                                  onClick={() => handleVerifyAction(u.id, "REJECT_ID")}
                                  className="px-3 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100"
                                >
                                  {t.admin.rejectIdBtn}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEW SCREENINGS WITH HISTORY */}
      {activeTab === "screenings" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-navy dark:text-white">
            {t.admin.screening} ({screeningsList.length})
          </h2>

          <div className="space-y-4">
            {screeningsList.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                ไม่มีแบบประเมินที่รอการพิจารณาในขณะนี้
              </div>
            ) : (
              screeningsList.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h4 className="font-bold text-base text-brand-navy dark:text-white">
                        {item.user?.profile?.fullName || item.user?.username} (@{item.user?.username})
                      </h4>
                      <p className="text-xs text-slate-500">
                        วันที่ทำ: {new Date(item.attemptDate).toLocaleString()} • Cooldown ถึง: {new Date(item.nextEligibleDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        คะแนนรวม: {item.totalScore} / {item.maxPossibleScore} ({item.riskLevel})
                      </span>
                    </div>
                  </div>

                  {/* Past History */}
                  {item.user?.screeningAttempts && item.user.screeningAttempts.length > 1 && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        ประวัติการทำแบบประเมินย้อนหลัง ({item.user.screeningAttempts.length} ครั้ง):
                      </span>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {item.user.screeningAttempts.map((past: any, idx: number) => (
                          <span
                            key={past.id}
                            className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                          >
                            ครั้งที่ {item.user.screeningAttempts.length - idx}: {past.totalScore} คะแนน ({past.status})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      disabled={actionProcessing === item.id}
                      onClick={() => handleScreeningAction(item.id, "APPROVE")}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-2xs"
                    >
                      {t.admin.approveScreeningBtn}
                    </button>
                    <button
                      disabled={actionProcessing === item.id}
                      onClick={() => {
                        const notes = prompt("ระบุหมายเหตุ / เหตุผลที่ไม่อนุมัติ:");
                        handleScreeningAction(item.id, "REJECT", notes || undefined);
                      }}
                      className="px-4 py-2 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-100"
                    >
                      {t.admin.rejectScreeningBtn}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ACCOMMODATIONS MANAGEMENT */}
      {activeTab === "accommodations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-navy dark:text-white">
              {t.admin.accommodations} ({accommodationsList.length})
            </h2>
            <button
              onClick={() => setShowAddAccModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.admin.addAccommodation}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accommodationsList.map((acc) => (
              <div
                key={acc.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-brand-teal">{acc.province}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      acc.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : acc.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {acc.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-brand-navy dark:text-white">
                  {acc.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">{acc.description}</p>
                <div className="text-xs font-semibold text-brand-navy dark:text-slate-200">
                  ฿{acc.pricePerNight.toLocaleString()} / คืน (สูงสุด {acc.maxGuests} คน)
                </div>

                <div className="text-[11px] text-slate-400">
                  Host: {acc.host?.profile?.fullName || acc.host?.username || "Admin"}
                </div>

                {acc.status === "PENDING" && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleAccAction(acc.id, "APPROVE")}
                      className="flex-1 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      {t.admin.approveAcc}
                    </button>
                    <button
                      onClick={() => handleAccAction(acc.id, "REJECT")}
                      className="flex-1 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100"
                    >
                      {t.admin.rejectAcc}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TRIPS MANAGEMENT */}
      {activeTab === "trips" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-navy dark:text-white">
            {t.admin.trips} ({tripsList.length})
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ชื่อทริป / จังหวัด</th>
                    <th className="px-6 py-4">ผู้สร้าง</th>
                    <th className="px-6 py-4">สมาชิก</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tripsList.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-brand-navy dark:text-white">
                          {tr.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {tr.province} • {new Date(tr.startDate).toLocaleDateString()} -{" "}
                          {new Date(tr.endDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-xs">
                        {tr.creator?.profile?.fullName || tr.creator?.username}
                      </td>

                      <td className="px-6 py-4 text-xs">
                        {tr.members?.length || 0} / {tr.maxMembers} คน
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            tr.status === "OPEN"
                              ? "bg-emerald-100 text-emerald-800"
                              : tr.status === "CANCELLED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {tr.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {tr.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleTripStatus(tr.id, "CANCELLED")}
                            className="px-3 py-1 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100"
                          >
                            {t.admin.cancelTrip}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EMERGENCY ALERTS (SOS) */}
      {activeTab === "emergencies" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-rose-600 flex items-center gap-2">
            <LifeBuoy className="w-6 h-6" />
            <span>{t.admin.emergency} ({emergenciesList.length})</span>
          </h2>

          <div className="space-y-4">
            {emergenciesList.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                {t.admin.noEmergency}
              </div>
            ) : (
              emergenciesList.map((em) => (
                <div
                  key={em.id}
                  className={`p-6 rounded-2xl border shadow-soft space-y-4 ${
                    em.status === "ACTIVE"
                      ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-brand-navy dark:text-white">
                          {em.user?.profile?.fullName || em.user?.username}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            em.status === "ACTIVE"
                              ? "bg-rose-600 text-white animate-pulse"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {em.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        ทริป: {em.trip?.title || "-"} ({em.trip?.province}) • เวลาแจ้ง:{" "}
                        {new Date(em.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${em.latitude},${em.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs shadow-xs hover:bg-rose-700"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>{t.admin.viewOnMap} ({em.latitude.toFixed(4)}, {em.longitude.toFixed(4)})</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Emergency contacts info */}
                  {em.user?.emergencyContacts && em.user.emergencyContacts[0] && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 text-xs space-y-1">
                      <span className="font-bold text-rose-700 dark:text-rose-400">
                        ผู้ติดต่อฉุกเฉินของผู้แจ้ง:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {em.user.emergencyContacts[0].name} ({em.user.emergencyContacts[0].relationship}) — โทร:{" "}
                        <strong className="text-brand-navy dark:text-white font-bold">
                          {em.user.emergencyContacts[0].phone}
                        </strong>
                      </p>
                    </div>
                  )}

                  {em.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      <strong>รายละเอียดเพิ่มเติม:</strong> {em.notes}
                    </p>
                  )}

                  {em.status === "ACTIVE" && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleEmergencyAction(em.id, "RESOLVED")}
                        className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                      >
                        {t.admin.resolveEmergency}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-navy dark:text-white">
            {t.admin.reports} ({reportsList.length})
          </h2>

          <div className="space-y-4">
            {reportsList.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
                {t.admin.noReports}
              </div>
            ) : (
              reportsList.map((rp) => (
                <div
                  key={rp.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-rose-600 uppercase">
                        เหตุผล: {rp.reason}
                      </span>
                      <p className="text-xs text-slate-500">
                        ผู้รายงาน: @{rp.reporter?.username} ➔ ผู้ถูกรายงาน: @
                        {rp.reportedUser?.username}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                      {rp.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {rp.details}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {rp.status !== "RESOLVED" && (
                      <button
                        onClick={() => handleReportAction(rp.id, "RESOLVED")}
                        className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        {t.admin.resolveReport}
                      </button>
                    )}
                    {rp.status !== "DISMISSED" && (
                      <button
                        onClick={() => handleReportAction(rp.id, "DISMISSED")}
                        className="px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
                      >
                        {t.admin.dismissReport}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 8: REFUNDS (LODGING PORTION ONLY) */}
      {activeTab === "refunds" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-brand-navy dark:text-white">
              {t.admin.refunds}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบคืนเงิน: คืนเฉพาะส่วนแบ่งค่าที่พัก (Lodging Share) ไม่คืนค่าธรรมเนียมคงที่ระบบ Together Go
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ผู้จ่าย</th>
                    <th className="px-6 py-4">ยอดรวม</th>
                    <th className="px-6 py-4">ค่าที่พัก (คืนได้)</th>
                    <th className="px-6 py-4">ค่าธรรมเนียม (ไม่คืน)</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {refundsList.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-brand-navy dark:text-white">
                          {pay.user?.profile?.fullName || pay.user?.username}
                        </div>
                        <div className="text-xs text-slate-500">
                          Ref: {pay.gatewayRef || pay.id}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-brand-navy dark:text-white">
                        ฿{pay.amount.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 font-bold text-emerald-600">
                        ฿{pay.shareAmount.toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-slate-400">
                        ฿{pay.platformFee.toLocaleString()}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            pay.status === "REFUNDED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {pay.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {pay.status === "SUCCESS" && (
                          <button
                            onClick={() => handleProcessRefund(pay.id)}
                            className="px-3 py-1 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-2xs"
                          >
                            คืนเงิน ฿{pay.shareAmount}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: HOST PAYOUTS */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-brand-navy dark:text-white">
            การโอนเงินให้เจ้าของที่พัก ({payoutsList.length})
          </h2>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ที่พัก / ทริป</th>
                    <th className="px-6 py-4">ยอดเงินโอน</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4">หลักฐาน</th>
                    <th className="px-6 py-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payoutsList.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-brand-navy dark:text-white">
                          {po.booking?.accommodation?.name || "ที่พัก"}
                        </div>
                        <div className="text-xs text-slate-500">
                          ทริป: {po.booking?.trip?.title || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-emerald-600">
                        ฿{po.amount.toLocaleString()} THB
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            po.status === "TRANSFERRED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        {po.transferProofUrl ? (
                          <button
                            onClick={() => setSelectedDoc(po.transferProofUrl)}
                            className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูหลักฐานโอน</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {po.status === "PENDING" && (
                          <button
                            onClick={() => handlePayoutTransfer(po.id)}
                            className="px-3 py-1 text-xs font-semibold bg-brand-teal text-white rounded-lg hover:bg-brand-teal-700"
                          >
                            บันทึกการโอนเงิน
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: EMAIL NOTIFICATIONS & PREVIEW (PHASE 8) */}
      {activeTab === "emails" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-brand-navy dark:text-white">
                {t.admin.emailLogs} ({emailLogs.length})
              </h2>
              <p className="text-xs text-slate-500">
                รองรับการแจ้งเตือน 5 เหตุการณ์: ยืนยันตัวตน, อนุมัติร่วมทริป, จ่ายเงินสำเร็จ, ทริปใกล้ถึง, ยืนยันที่พัก
              </p>
            </div>

            <button
              onClick={handleSendTestEmail}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal text-white font-semibold text-xs shadow-xs"
            >
              <Mail className="w-4 h-4" />
              <span>สร้างอีเมลทดสอบ</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ผู้รับ (To)</th>
                    <th className="px-6 py-4">เหตุการณ์ (Event)</th>
                    <th className="px-6 py-4">หัวข้อ (Subject)</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4 text-right">Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        {t.admin.noEmailLogs}
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-brand-navy dark:text-white">
                            {log.toName || log.toEmail}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {log.toEmail}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {log.eventType}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-xs font-medium text-brand-navy dark:text-white max-w-xs truncate">
                          {log.subject}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              log.status === "SENT"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedEmailHtml(log.bodyHtml)}
                            className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.admin.emailPreview}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: SETTINGS (ADMIN ONLY) */}
      {isAdmin && activeTab === "settings" && (
        <div className="max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-card space-y-6">
          <h2 className="text-xl font-bold text-brand-navy dark:text-white">
            {t.admin.settings}
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.admin.platformFeeLabel}
              </label>
              <input
                type="number"
                step="5"
                required
                value={settingsForm.platformFeePerUser}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, platformFeePerUser: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.admin.screeningThresholdLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  max="27"
                  required
                  value={settingsForm.screeningThreshold}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, screeningThreshold: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.admin.cooldownDaysLabel}
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  required
                  value={settingsForm.screeningCooldownDays}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, screeningCooldownDays: e.target.value })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.admin.emailDomainLabel}
              </label>
              <input
                type="text"
                required
                value={settingsForm.emailSenderDomain}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, emailSenderDomain: e.target.value })
                }
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
              />
            </div>

            {/* Real SMTP Options */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settingsForm.smtpEnabled}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, smtpEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-brand-teal rounded"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t.admin.smtpEnabledLabel}
                </span>
              </label>

              {settingsForm.smtpEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      {t.admin.smtpHostLabel}
                    </label>
                    <input
                      type="text"
                      value={settingsForm.smtpHost}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, smtpHost: e.target.value })
                      }
                      placeholder="smtp.example.com"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">
                      {t.admin.smtpPortLabel}
                    </label>
                    <input
                      type="number"
                      value={settingsForm.smtpPort}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, smtpPort: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={actionProcessing === "settings"}
                className="px-6 py-2.5 rounded-xl font-semibold text-white bg-brand-teal hover:bg-brand-teal-700 shadow-xs"
              >
                {t.admin.saveSettings}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 12: STAFF MANAGEMENT (ADMIN ONLY) */}
      {isAdmin && activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-brand-navy dark:text-white">
              {t.admin.staff} ({staffList.length})
            </h2>

            <button
              onClick={() => {
                const target = prompt("กรุณาระบุ Username หรือ Email ของผู้ใช้ที่ต้องการแต่งตั้งเป็น Staff:");
                if (target) handleGrantStaff(target.trim());
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 text-white font-semibold text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.admin.grantStaff}</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">พนักงาน</th>
                    <th className="px-6 py-4">อีเมล</th>
                    <th className="px-6 py-4">สิทธิ์การทำงาน</th>
                    <th className="px-6 py-4 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                        {t.admin.noStaff}
                      </td>
                    </tr>
                  ) : (
                    staffList.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-6 py-4 font-semibold text-brand-navy dark:text-white">
                          {st.profile?.fullName || st.username} (@{st.username})
                        </td>

                        <td className="px-6 py-4 text-slate-500">{st.email}</td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {st.permissions?.map((p: string) => (
                              <span
                                key={p}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRevokeStaff(st.id)}
                            className="px-3 py-1 text-xs font-semibold bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100"
                          >
                            {t.admin.revokeStaff}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl max-w-xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="font-semibold text-brand-navy dark:text-white">
                พรีวิวเอกสาร / รูปภาพ
              </h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedDoc}
                alt="Document Preview"
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Email HTML Preview Modal */}
      {selectedEmailHtml && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedEmailHtml(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl max-w-2xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <h3 className="font-semibold text-brand-navy dark:text-white">
                ตัวอย่างอีเมล (Email Template Preview)
              </h3>
              <button
                onClick={() => setSelectedEmailHtml(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-xl bg-white p-2 border border-slate-200">
              <iframe
                srcDoc={selectedEmailHtml}
                title="Email Preview"
                className="w-full h-[65vh] border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Accommodation by Admin Modal */}
      {showAddAccModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddAccModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-lg w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-brand-navy dark:text-white">
                {t.admin.addAccommodation}
              </h3>
              <button
                onClick={() => setShowAddAccModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdminAcc} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">ชื่อที่พัก *</label>
                <input
                  type="text"
                  required
                  value={accForm.name}
                  onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">จังหวัด *</label>
                  <input
                    type="text"
                    required
                    value={accForm.province}
                    onChange={(e) => setAccForm({ ...accForm, province: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">ราคาต่อคืน (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={accForm.pricePerNight}
                    onChange={(e) => setAccForm({ ...accForm, pricePerNight: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ที่อยู่ *</label>
                <input
                  type="text"
                  required
                  value={accForm.address}
                  onChange={(e) => setAccForm({ ...accForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">คำอธิบาย *</label>
                <textarea
                  rows={2}
                  required
                  value={accForm.description}
                  onChange={(e) => setAccForm({ ...accForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">URL รูปภาพ</label>
                <input
                  type="url"
                  value={accForm.imagesJson}
                  onChange={(e) => setAccForm({ ...accForm, imagesJson: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-brand-teal text-white font-semibold"
                >
                  บันทึกที่พัก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
