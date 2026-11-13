"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  MapPin,
  Home,
  Plus,
  Trash2,
  Car,
  MessageSquare,
  LifeBuoy,
  Flag,
  Star,
  CreditCard,
  Building,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { VerifiedBadge, ScreeningBadge } from "@/components/StatusBadges";

export default function TripDetailPage() {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [userMembership, setUserMembership] = useState<any>(null);
  const [isCreator, setIsCreator] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(true);

  // Manage roles
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);

  // Driver system (Phase 4)
  const [driverApps, setDriverApps] = useState<any[]>([]);
  const [driverVotes, setDriverVotes] = useState<any[]>([]);
  const [showApplyDriverModal, setShowApplyDriverModal] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [driverLicenseUrl, setDriverLicenseUrl] = useState("");

  // Group Chat (Phase 6)
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // SOS Emergency (Phase 6)
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosNotes, setSosNotes] = useState("");
  const [sosSentSuccess, setSosSentSuccess] = useState(false);
  const [sosCoords, setSosCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Report user (Phase 6)
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState("");
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDetails, setReportDetails] = useState("");

  // Review & Rating (Phase 6)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewTargetId, setReviewTargetId] = useState("");
  const [reviewType, setReviewType] = useState<"MEMBER" | "DRIVER">("MEMBER");
  const [reviewScore, setReviewScore] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [existingRatings, setExistingRatings] = useState<any[]>([]);

  // Payment Checkout Sandbox (Phase 9)
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Booking details (Phase 7)
  const [bookingData, setBookingData] = useState<any>(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTripDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      if (res.ok) {
        const data = await res.json();
        setTrip(data.trip);
        setUserMembership(data.userMembership);
        setIsCreator(data.isCreator);
      } else {
        router.push("/");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTrip(false);
    }
  }, [tripId, router]);

  const fetchDriverInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/drivers`);
      if (res.ok) {
        const d = await res.json();
        setDriverApps(d.applications || []);
        setDriverVotes(d.votes || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [tripId]);

  const fetchBookingInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/booking`);
      if (res.ok) {
        const d = await res.json();
        setBookingData(d.booking || null);
      }
    } catch (e) {
      console.error(e);
    }
  }, [tripId]);

  const fetchRatings = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/reviews`);
      if (res.ok) {
        const d = await res.json();
        setExistingRatings(d.ratings || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, [tripId]);

  useEffect(() => {
    fetchTripDetail();
    fetchDriverInfo();
    fetchBookingInfo();
    fetchRatings();
  }, [fetchTripDetail, fetchDriverInfo, fetchBookingInfo, fetchRatings]);

  // Polling for Chat when modal is open
  useEffect(() => {
    let interval: any = null;
    if (showChatModal) {
      const fetchChat = async () => {
        try {
          const res = await fetch(`/api/trips/${tripId}/messages`);
          if (res.ok) {
            const data = await res.json();
            setChatMessages(data.messages || []);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchChat();
      interval = setInterval(fetchChat, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showChatModal, tripId]);

  // Handle GPS for SOS
  const handleOpenSos = () => {
    setShowSosModal(true);
    setSosSentSuccess(false);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSosCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // Fallback to Chiang Mai default coordinates if denied in browser
          setSosCoords({ lat: 18.7883, lng: 98.9853 });
        }
      );
    } else {
      setSosCoords({ lat: 18.7883, lng: 98.9853 });
    }
  };

  const handleSendSos = async () => {
    if (!sosCoords) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/emergency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: sosCoords.lat,
          longitude: sosCoords.lng,
          notes: sosNotes,
        }),
      });
      if (res.ok) {
        setSosSentSuccess(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: chatInput }),
      });
      if (res.ok) {
        setChatInput("");
        const msgRes = await fetch(`/api/trips/${tripId}/messages`);
        if (msgRes.ok) {
          const data = await msgRes.json();
          setChatMessages(data.messages || []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleJoinTrip = async () => {
    if (!user) {
      router.push("/auth");
      return;
    }

    if (!user.isVerified || user.screeningStatus !== "PASSED") {
      setFeedbackMsg({
        type: "error",
        text: t.trips.detail.mustVerifyToJoin,
      });
      return;
    }

    setActionLoading(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`/api/trips/${tripId}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join");
      }
      setFeedbackMsg({ type: "success", text: "ส่งคำขอเข้าร่วมทริปเรียบร้อยแล้ว!" });
      await fetchTripDetail();
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageMember = async (targetUserId: string, action: "APPROVE" | "REJECT") => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/manage-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });
      if (res.ok) {
        await fetchTripDetail();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Driver Actions
  const handleApplyDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      // If user uploaded a new license url, first save license document
      if (driverLicenseUrl) {
        await fetch("/api/driver/license", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl: driverLicenseUrl }),
        });
      }

      const res = await fetch(`/api/trips/${tripId}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleInfo,
          licenseDocUrl: driverLicenseUrl || undefined,
        }),
      });

      if (res.ok) {
        setShowApplyDriverModal(false);
        await fetchDriverInfo();
        alert("ส่งใบสมัครเป็นคนขับเรียบร้อยแล้ว!");
      } else {
        const d = await res.json();
        alert(d.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoteDriver = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/drivers/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, action: "VOTE" }),
      });
      if (res.ok) {
        await fetchDriverInfo();
      } else {
        const d = await res.json();
        alert(d.error || "เกิดข้อผิดพลาด");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectDriver = async (candidateId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/drivers/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, action: "SELECT" }),
      });
      if (res.ok) {
        await fetchDriverInfo();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Payment Checkout
  const handleOpenPayment = async () => {
    try {
      const res = await fetch(`/api/payments/checkout?tripId=${tripId}`);
      if (res.ok) {
        const d = await res.json();
        setPaymentBreakdown(d.breakdown);
        setShowPaymentModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulatePayment = async () => {
    setIsPaying(true);
    try {
      // Step 1: create payment record
      const createRes = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      const paymentData = await createRes.json();

      if (paymentData.paymentId) {
        // Step 2: call webhook to simulate instant success
        const hookRes = await fetch("/api/payments/webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId: paymentData.paymentId,
            status: "SUCCESS",
          }),
        });

        if (hookRes.ok) {
          setShowPaymentModal(false);
          await fetchTripDetail();
          alert("ชำระเงินจำลอง (Sandbox) สำเร็จ! สถานะของคุณคือ PAID และปลดล็อคห้องแชทแล้ว");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaying(false);
    }
  };

  // Cancellation & Refund
  const handleCancelAndRefund = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเข้าร่วมทริป? (ระบบจะคืนเฉพาะค่าที่พัก ไม่คืนค่าธรรมเนียม)")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId }),
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message);
        await fetchTripDetail();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Roles Actions
  const handleClaimRole = async (roleId: string) => {
    if (!user) {
      router.push("/auth");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, action: "CLAIM" }),
      });
      if (res.ok) await fetchTripDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnclaimRole = async (roleId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, action: "UNCLAIM" }),
      });
      if (res.ok) await fetchTripDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD",
          roleName: newRoleName.trim(),
          description: newRoleDesc.trim(),
        }),
      });
      if (res.ok) {
        setNewRoleName("");
        setNewRoleDesc("");
        setShowAddRole(false);
        await fetchTripDetail();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId, action: "DELETE" }),
      });
      if (res.ok) await fetchTripDetail();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: reviewTargetId,
          ratingType: reviewType,
          score: reviewScore,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setShowReviewModal(false);
        setReviewComment("");
        await fetchRatings();
        alert("บันทึกการให้คะแนนรีวิวสำเร็จ!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: reportTargetId,
          tripId,
          reason: reportReason,
          details: reportDetails,
        }),
      });
      if (res.ok) {
        setShowReportModal(false);
        setReportDetails("");
        alert("ส่งรายงานผู้ใช้เข้าสู่ระบบเรียบร้อยแล้ว เจ้าหน้าที่จะดำเนินการตรวจสอบ");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingTrip) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">{t.common.loading}</p>
      </div>
    );
  }

  if (!trip) return null;

  const startDateFormatted = new Date(trip.startDate).toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );
  const endDateFormatted = new Date(trip.endDate).toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { day: "numeric", month: "long", year: "numeric" }
  );

  const fallbackCover =
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80";

  const isApprovedOrPaid =
    userMembership?.status === "APPROVED" || userMembership?.status === "PAID" || isCreator;
  const isPaid = userMembership?.status === "PAID" || isCreator;

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Cover Banner */}
      <div className="relative h-72 sm:h-96 w-full overflow-hidden bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trip.coverImage || fallbackCover}
          alt={trip.title}
          className="w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-linear-to-t from-brand-navy-950 via-brand-navy-950/40 to-transparent" />

        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-teal text-white shadow-xs">
              <MapPin className="w-3.5 h-3.5" />
              <span>{trip.province}</span>
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-white">
              <Calendar className="w-3.5 h-3.5 text-brand-teal-300" />
              <span>
                {startDateFormatted} - {endDateFormatted}
              </span>
            </span>

            {trip.nights && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-slate-200">
                {trip.days} วัน {trip.nights} คืน
              </span>
            )}

            {bookingData && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-600 text-white shadow-xs">
                <Building className="w-3.5 h-3.5" />
                <span>ที่พัก: {bookingData.status}</span>
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {trip.title}
          </h1>
        </div>
      </div>

      {/* Main Content & Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Action Header Banner for Emergency / Chat */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft mb-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              เมนูทริป:
            </span>
            {isApprovedOrPaid ? (
              <button
                onClick={() => setShowChatModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-brand-teal font-semibold text-xs border border-teal-200 hover:bg-teal-100"
              >
                <MessageSquare className="w-4 h-4" />
                <span>แชทกลุ่มทริป {isPaid ? "" : "(ต้องจ่ายเงินก่อน)"}</span>
              </button>
            ) : null}

            <button
              onClick={handleOpenSos}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs animate-pulse"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>แจ้งเหตุฉุกเฉิน SOS (191 / 1669)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {userMembership?.status === "PAID" && (
              <button
                onClick={handleCancelAndRefund}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ยกเลิกทริป & ขอคืนเงิน</span>
              </button>
            )}
          </div>
        </div>

        {feedbackMsg && (
          <div
            className={`p-4 rounded-2xl text-sm font-medium mb-6 ${
              feedbackMsg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column (Details, Roles, Drivers, Reviews) */}
          <div className="lg:col-span-8 space-y-10">
            {/* 1. Trip Description */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
              <h2 className="text-xl font-bold text-brand-navy dark:text-white">
                {t.trips.detail.detailsHeading}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {trip.description}
              </p>
            </section>

            {/* 2. Accommodation Info */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center gap-2 text-brand-teal">
                <Home className="w-5 h-5" />
                <h2 className="text-xl font-bold text-brand-navy dark:text-white">
                  {t.trips.detail.accommodationHeading}
                </h2>
              </div>

              {trip.accommodation ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-base text-brand-navy dark:text-white">
                      {trip.accommodation.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {trip.accommodation.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-brand-teal block">
                      ฿{trip.accommodation.pricePerNight.toLocaleString()} / คืน
                    </span>
                    <span className="text-xs text-slate-400">
                      หาร {trip.maxMembers} คน = ฿{trip.costBreakdown?.accPerPerson.toLocaleString()} / คน
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t.trips.detail.noAccSelected}</p>
              )}
            </section>

            {/* 3. Driver System (Phase 4) */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Car className="w-6 h-6 text-brand-teal" />
                  <div>
                    <h2 className="text-xl font-bold text-brand-navy dark:text-white">
                      ระบบคนขับประจำทริป (Driver Selection)
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      เฉพาะผู้ที่มีใบขับขี่ที่ได้รับการรับรอง • สมาชิกโหวต • คนสร้างยืนยัน
                    </p>
                  </div>
                </div>

                {user && (
                  <button
                    onClick={() => setShowApplyDriverModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-teal hover:bg-brand-teal-700 text-white text-xs font-semibold shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.driver.applyDriver}</span>
                  </button>
                )}
              </div>

              {/* Driver Candidates */}
              <div className="space-y-3">
                {driverApps.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400">
                    {t.driver.noDriverApplicants}
                  </div>
                ) : (
                  driverApps.map((app) => {
                    const isSelected = app.status === "SELECTED";
                    const hasVotedThis = driverVotes.some(
                      (v) => v.candidateId === app.userId && v.voterId === user?.id
                    );

                    return (
                      <div
                        key={app.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-navy dark:text-white text-sm">
                              {app.user?.profile?.fullName || app.user?.username}
                            </span>
                            {isSelected && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
                                {t.driver.driverSelected}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>รถ: {app.vehicleInfo || "ไม่ระบุ"}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-600 font-semibold">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>
                                {app.avgRating ? `${app.avgRating.toFixed(1)} / 5` : t.driver.noRating}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              {t.driver.votes}: <strong>{app.voteCount}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Member Vote Button */}
                          {user && (
                            <button
                              disabled={hasVotedThis}
                              onClick={() => handleVoteDriver(app.userId)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                hasVotedThis
                                  ? "bg-slate-100 text-slate-400"
                                  : "bg-teal-50 text-brand-teal border border-teal-200 hover:bg-teal-100"
                              }`}
                            >
                              {hasVotedThis ? t.driver.votedAlready : t.driver.voteDriver}
                            </button>
                          )}

                          {/* Creator Confirm Driver Button */}
                          {isCreator && !isSelected && (
                            <button
                              onClick={() => handleSelectDriver(app.userId)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                            >
                              {t.driver.selectDriver}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* 4. Trip Roles */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-brand-navy dark:text-white">
                    {t.trips.detail.rolesHeading}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.trips.detail.rolesSubtitle}
                  </p>
                </div>

                {isCreator && (
                  <button
                    onClick={() => setShowAddRole(!showAddRole)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy dark:bg-brand-teal text-white text-xs font-semibold shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.trips.detail.addRoleBtn}</span>
                  </button>
                )}
              </div>

              {showAddRole && (
                <form
                  onSubmit={handleAddRole}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <input
                    type="text"
                    required
                    placeholder={t.trips.detail.newRoleNamePlaceholder}
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    placeholder={t.trips.detail.newRoleDescPlaceholder}
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddRole(false)}
                      className="px-3 py-1.5 rounded-lg text-slate-600"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-1.5 rounded-xl bg-brand-teal text-white font-semibold"
                    >
                      {t.common.save}
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trip.roles?.map((role: any) => {
                  const isAssigned = Boolean(role.userId);
                  const isMe = role.userId === user?.id;

                  return (
                    <div
                      key={role.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-brand-navy dark:text-white">
                            {role.roleName}
                          </h4>
                          {isCreator && (
                            <button
                              onClick={() => handleDeleteRole(role.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="ลบหน้าที่"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {role.description && (
                          <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs text-slate-500">
                          {isAssigned
                            ? `${t.trips.detail.claimedBy} ${
                                role.user?.profile?.fullName || role.user?.username
                              }`
                            : t.trips.detail.unclaimed}
                        </span>

                        {isMe ? (
                          <button
                            onClick={() => handleUnclaimRole(role.id)}
                            className="text-xs font-semibold text-rose-600 hover:underline"
                          >
                            {t.trips.detail.unclaimBtn}
                          </button>
                        ) : !isAssigned ? (
                          <button
                            onClick={() => handleClaimRole(role.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-brand-teal text-white rounded-lg hover:bg-brand-teal-700"
                          >
                            {t.trips.detail.claimRoleBtn}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Reviews & Ratings Section (Phase 6) */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-navy dark:text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <span>รีวิวและให้คะแนน (Reviews & Ratings)</span>
                </h2>
              </div>

              <div className="space-y-3">
                {existingRatings.length === 0 ? (
                  <p className="text-xs text-slate-400">{t.review.noReviews}</p>
                ) : (
                  existingRatings.map((rt) => (
                    <div
                      key={rt.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-brand-navy dark:text-white">
                          @{rt.author?.username} ให้คะแนน @{rt.target?.username} (
                          {rt.ratingType === "DRIVER" ? "คนขับ" : "เพื่อนร่วมทริป"})
                        </span>
                        <div className="flex items-center text-amber-500 font-bold">
                          {"★".repeat(rt.score)}
                          <span className="text-slate-400 ml-1">({rt.score}/5)</span>
                        </div>
                      </div>
                      {rt.comment && (
                        <p className="text-slate-600 dark:text-slate-300 italic">
                          &ldquo;{rt.comment}&rdquo;
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Cost Breakdown & Members Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Cost Breakdown Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
              <h3 className="font-bold text-base text-brand-navy dark:text-white">
                {t.trips.detail.costBreakdownHeading}
              </h3>

              <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 dark:text-slate-400">
                    {t.trips.detail.accShareLabel}
                  </span>
                  <span className="font-bold text-brand-navy dark:text-white">
                    ฿{trip.costBreakdown?.accPerPerson.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    {t.trips.detail.platformFeeLabel}
                  </span>
                  <span className="font-bold text-brand-navy dark:text-white">
                    ฿{trip.costBreakdown?.platformFee.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    {t.trips.detail.fuelShareLabel}
                  </span>
                  <span className="font-bold text-slate-500">
                    ~฿{trip.costBreakdown?.fuelPerPerson.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-3 text-sm">
                  <span className="font-bold text-brand-navy dark:text-white">
                    {t.trips.detail.totalEstLabel}
                  </span>
                  <span className="text-xl font-bold text-brand-teal">
                    ฿{trip.costBreakdown?.totalEstimatedCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons for User Membership */}
              <div className="pt-2">
                {!user ? (
                  <Link
                    href="/auth"
                    className="w-full py-3 rounded-xl font-semibold text-white bg-brand-navy dark:bg-brand-teal hover:bg-brand-navy-800 text-center block text-xs"
                  >
                    {t.trips.detail.loginToJoin}
                  </Link>
                ) : userMembership?.status === "PAID" ? (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-bold text-center text-xs">
                    ✓ {t.trips.detail.joinPaid}
                  </div>
                ) : userMembership?.status === "APPROVED" ? (
                  <button
                    onClick={handleOpenPayment}
                    className="w-full py-3 rounded-xl font-bold text-white bg-brand-teal hover:bg-brand-teal-700 shadow-md text-xs flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{t.payment.payNow} (โหมดทดสอบ Sandbox)</span>
                  </button>
                ) : userMembership?.status === "REQUESTED" ? (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 font-semibold text-center text-xs">
                    {t.trips.detail.joinRequested}
                  </div>
                ) : (
                  <button
                    onClick={handleJoinTrip}
                    disabled={actionLoading || trip.seatsLeft === 0}
                    className="w-full py-3 rounded-xl font-semibold text-white bg-brand-teal hover:bg-brand-teal-700 disabled:opacity-50 text-xs shadow-md transition-all"
                  >
                    {trip.seatsLeft === 0
                      ? t.trips.detail.statusFull
                      : t.trips.detail.joinTripBtn}
                  </button>
                )}
              </div>
            </div>

            {/* Members List & Creator Management */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-brand-navy dark:text-white">
                  {t.trips.detail.membersHeading} ({trip.members?.length || 0} / {trip.maxMembers})
                </h3>
              </div>

              <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                {trip.members?.map((m: any) => {
                  const isCreatorItem = m.userId === trip.creatorId;

                  return (
                    <div key={m.id} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-brand-navy dark:text-white">
                              {m.user?.profile?.fullName || m.user?.username}
                            </span>
                            {isCreatorItem && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                {t.trips.detail.creatorBadge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {m.user?.isVerified && <VerifiedBadge isVerified size="sm" />}
                            {/* Shows Screening status without individual item answers */}
                            <ScreeningBadge status={m.user?.screeningStatus || "NOT_STARTED"} size="sm" />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              m.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : m.status === "APPROVED"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {m.status}
                          </span>

                          {/* Member action icons: Report, Review */}
                          {user && user.id !== m.userId && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setReviewTargetId(m.userId);
                                  setShowReviewModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-amber-500"
                                title="ให้คะแนนรีวิว"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setReportTargetId(m.userId);
                                  setShowReportModal(true);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500"
                                title="รายงานผู้ใช้"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Creator Approval Action (Per PLAN.md Phase 4: creator reviews profile & screening risk level without answers) */}
                      {isCreator && m.status === "REQUESTED" && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-500">คำขอเข้าร่วมทริป:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleManageMember(m.userId, "APPROVE")}
                              className="px-2.5 py-1 font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                            >
                              {t.trips.detail.approveBtn}
                            </button>
                            <button
                              onClick={() => handleManageMember(m.userId, "REJECT")}
                              className="px-2.5 py-1 font-semibold text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100"
                            >
                              {t.trips.detail.rejectBtn}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT MODAL (Phase 6) */}
      {showChatModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowChatModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full h-[650px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-teal" />
                <h3 className="font-bold text-brand-navy dark:text-white">
                  แชทกลุ่ม: {trip.title}
                </h3>
              </div>
              <button
                onClick={() => setShowChatModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t.chat.noMessages}
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.userId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <span className="text-[10px] text-slate-400 mb-0.5">
                        {isMe ? t.chat.you : msg.user?.profile?.fullName || msg.user?.username}
                      </span>
                      <div
                        className={`p-3 rounded-2xl max-w-xs text-xs sm:text-sm ${
                          isMe
                            ? "bg-brand-teal text-white rounded-br-none"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={t.chat.messagePlaceholder}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
              <button
                type="submit"
                disabled={chatLoading}
                className="p-2.5 rounded-xl bg-brand-teal text-white hover:bg-brand-teal-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SOS EMERGENCY MODAL (Phase 6) */}
      {showSosModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSosModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-200 dark:border-rose-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-rose-100 dark:border-slate-800">
              <h3 className="font-bold text-lg text-rose-600 flex items-center gap-2">
                <LifeBuoy className="w-5 h-5" />
                <span>{t.sos.title}</span>
              </h3>
              <button
                onClick={() => setShowSosModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Emergency Hotline Numbers */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <a
                href="tel:191"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 hover:bg-rose-100"
              >
                🚨 ตำรวจ 191
              </a>
              <a
                href="tel:1669"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 hover:bg-rose-100"
              >
                🚑 การแพทย์ฉุกเฉิน 1669
              </a>
            </div>

            {/* GPS Location Display */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                พิกัด GPS ของคุณ:
              </span>
              <p className="font-mono text-slate-500">
                {sosCoords
                  ? `Lat: ${sosCoords.lat.toFixed(6)}, Lng: ${sosCoords.lng.toFixed(6)}`
                  : t.sos.gettingLocation}
              </p>
              {sosCoords && (
                <a
                  href={`https://www.google.com/maps?q=${sosCoords.lat},${sosCoords.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-brand-teal hover:underline font-semibold"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>ดูตำแหน่งบน Google Maps</span>
                </a>
              )}
            </div>

            {/* Emergency Contact */}
            {user?.emergencyContacts && user.emergencyContacts[0] && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 space-y-0.5">
                <span className="font-bold">{t.sos.emergencyContact}:</span>
                <p>
                  {user.emergencyContacts[0].name} ({user.emergencyContacts[0].relationship}) — โทร:{" "}
                  <strong>{user.emergencyContacts[0].phone}</strong>
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">
                {t.sos.notes}
              </label>
              <textarea
                rows={2}
                placeholder={t.sos.notesPlaceholder}
                value={sosNotes}
                onChange={(e) => setSosNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
              />
            </div>

            {sosSentSuccess ? (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center">
                ✓ {t.sos.sosSent}
              </div>
            ) : (
              <button
                onClick={handleSendSos}
                disabled={actionLoading || !sosCoords}
                className="w-full py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 text-sm shadow-md"
              >
                {t.sos.sendSOS}
              </button>
            )}
          </div>
        </div>
      )}

      {/* DRIVER APPLICATION MODAL (Phase 4) */}
      {showApplyDriverModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowApplyDriverModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-brand-navy dark:text-white">
                {t.driver.applyDriver}
              </h3>
              <button
                onClick={() => setShowApplyDriverModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyDriver} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  {t.driver.vehicleInfo} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น Toyota Fortuner สีขาว ทะเบียน กข 1234 เชียงใหม่"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  URL ภาพถ่ายใบขับขี่ (หากยังไม่อนุมัติในระบบ)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={driverLicenseUrl}
                  onChange={(e) => setDriverLicenseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyDriverModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-brand-teal text-white font-semibold shadow-xs"
                >
                  {t.common.submit}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SANDBOX PAYMENT MODAL (Phase 9) */}
      {showPaymentModal && paymentBreakdown && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-brand-navy dark:text-white">
                {t.payment.title}
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-xs text-sky-800 dark:text-sky-300 font-medium text-center">
              🧪 {t.payment.sandboxNotice}
            </div>

            <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">{t.payment.accShare}:</span>
                <span className="font-bold">฿{paymentBreakdown.accSharePerPerson.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-500">{t.payment.platformFee}:</span>
                <span className="font-bold">฿{paymentBreakdown.platformFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-bold text-brand-teal">
                <span>{t.payment.totalPayment}:</span>
                <span>฿{paymentBreakdown.totalAmount.toLocaleString()} THB</span>
              </div>
            </div>

            <div className="pt-3">
              <button
                onClick={handleSimulatePayment}
                disabled={isPaying}
                className="w-full py-3 rounded-xl font-bold text-white bg-brand-teal hover:bg-brand-teal-700 shadow-md text-sm"
              >
                {isPaying ? t.common.loading : "ยืนยันชำระเงินจำลอง (Simulate Payment)"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & RATING MODAL (Phase 6) */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowReviewModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-brand-navy dark:text-white">
                {t.review.title}
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">ประเภทการให้คะแนน</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewType("MEMBER")}
                    className={`py-2 rounded-xl font-semibold border ${
                      reviewType === "MEMBER"
                        ? "bg-brand-teal text-white border-brand-teal"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    เพื่อนร่วมทริป
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewType("DRIVER")}
                    className={`py-2 rounded-xl font-semibold border ${
                      reviewType === "DRIVER"
                        ? "bg-brand-teal text-white border-brand-teal"
                        : "bg-slate-50 text-slate-600"
                    }`}
                  >
                    คนขับรถ
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  {t.review.scoreLabel}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setReviewScore(s)}
                      className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center ${
                        reviewScore >= s
                          ? "bg-amber-400 text-white shadow-xs"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="font-bold text-sm ml-2">{reviewScore} / 5</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  {t.review.commentLabel}
                </label>
                <textarea
                  rows={3}
                  placeholder={t.review.commentPlaceholder}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-brand-teal text-white font-semibold"
                >
                  {t.review.submitReview}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT USER MODAL (Phase 6) */}
      {showReportModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-rose-600 flex items-center gap-2">
                <Flag className="w-5 h-5" />
                <span>{t.report.title}</span>
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">{t.report.reason}</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="harassment">{t.report.reasonOptions.harassment}</option>
                  <option value="inappropriate">{t.report.reasonOptions.inappropriate}</option>
                  <option value="scam">{t.report.reasonOptions.scam}</option>
                  <option value="dangerous">{t.report.reasonOptions.dangerous}</option>
                  <option value="other">{t.report.reasonOptions.other}</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">{t.report.details} *</label>
                <textarea
                  required
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="ระบุข้อเท็จจริงหรือพฤติกรรมที่ไม่เหมาะสมอย่างชัดเจน..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-600"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700"
                >
                  {t.report.submitReport}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
