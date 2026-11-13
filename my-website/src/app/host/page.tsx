"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Building2,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
  ArrowRight,
} from "lucide-react";

export default function HostDashboardPage() {
  const { user, loading, hasRole, refreshUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [accommodations, setAccommodations] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [totalEarned, setTotalEarned] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    province: "",
    address: "",
    pricePerNight: "",
    maxGuests: "4",
    imagesJson: "",
  });

  const isHost = hasRole("HOST") || hasRole("ADMIN");

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [accRes, payRes] = await Promise.all([
        fetch("/api/host/accommodations"),
        fetch("/api/host/payouts"),
      ]);
      if (accRes.ok) {
        const d = await accRes.json();
        setAccommodations(d.accommodations || []);
      }
      if (payRes.ok) {
        const p = await payRes.json();
        setPayouts(p.payouts || []);
        setTotalEarned(p.totalEarned || 0);
        setPendingAmount(p.pendingAmount || 0);
      }
    } catch (err) {
      console.error("Host data fetch error:", err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth");
      } else if (isHost) {
        fetchData();
      }
    }
  }, [user, loading, isHost, router, fetchData]);

  const handleBecomeHost = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/host/become", { method: "POST" });
      if (res.ok) {
        await refreshUser();
        await fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccommodation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/host/accommodations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          name: "",
          description: "",
          province: "",
          address: "",
          pricePerNight: "",
          maxGuests: "4",
          imagesJson: "",
        });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not yet a Host -> Switch to Host Mode banner
  if (!isHost) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-200/80 dark:border-slate-800 shadow-card space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-slate-800 text-brand-teal flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">
            {t.host.becomeHostBtn}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
            {t.host.becomeHostDesc}
          </p>

          <button
            onClick={handleBecomeHost}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-brand-teal hover:bg-brand-teal-700 shadow-md transition-all text-base"
          >
            <span>{t.host.switchToHost}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy dark:text-white">
              {t.host.pageTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Host Portal
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.host.pageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loadingData}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-teal hover:bg-brand-teal-700 text-white font-semibold text-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.host.addAccommodation}</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>{t.host.myAccommodations}</span>
            <Building2 className="w-4 h-4 text-brand-teal" />
          </div>
          <p className="text-3xl font-bold text-brand-navy dark:text-white mt-2">
            {accommodations.length}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <span>{t.host.totalEarnings}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            ฿{totalEarned.toLocaleString()}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <span>{t.host.pendingPayout}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            ฿{pendingAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Accommodations Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-brand-navy dark:text-white">
          {t.host.myAccommodations} ({accommodations.length})
        </h2>

        {accommodations.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-3">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto" />
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {t.host.noAccommodations}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-teal text-white hover:bg-brand-teal-700"
            >
              {t.host.addAccommodation}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accommodations.map((acc) => {
              const images = acc.imagesJson ? JSON.parse(acc.imagesJson) : [];
              const cover = images[0] || "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80";

              return (
                <div
                  key={acc.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft overflow-hidden flex flex-col"
                >
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cover}
                      alt={acc.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      {acc.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-xs">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{t.host.accStatusApproved}</span>
                        </span>
                      )}
                      {acc.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white shadow-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{t.host.accStatusPending}</span>
                        </span>
                      )}
                      {acc.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{t.host.accStatusRejected}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-xs font-medium text-brand-teal">
                        {acc.province}
                      </span>
                      <h3 className="font-bold text-base text-brand-navy dark:text-white line-clamp-1">
                        {acc.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {acc.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        รองรับสูงสุด {acc.maxGuests} คน
                      </span>
                      <span className="font-bold text-brand-navy dark:text-white text-sm">
                        ฿{acc.pricePerNight.toLocaleString()} / คืน
                      </span>
                    </div>

                    {acc.bookings && acc.bookings.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                        <span className="font-semibold text-brand-navy dark:text-slate-300">
                          การจองล่าสุด:
                        </span>{" "}
                        {acc.bookings[0].trip?.title} ({acc.bookings[0].status})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookings & Payouts Table */}
      <div className="space-y-4 pt-6">
        <h2 className="text-xl font-bold text-brand-navy dark:text-white">
          {t.host.payouts} ({payouts.length})
        </h2>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">ที่พัก / ทริป</th>
                  <th className="px-6 py-4">จำนวนเงิน</th>
                  <th className="px-6 py-4">สถานะการโอน</th>
                  <th className="px-6 py-4">หลักฐานการโอน</th>
                  <th className="px-6 py-4">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      {t.host.noPayouts}
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-brand-navy dark:text-white">
                          {p.booking?.accommodation?.name || "ที่พัก"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          ทริป: {p.booking?.trip?.title || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-brand-teal">
                        ฿{p.amount.toLocaleString()} THB
                      </td>

                      <td className="px-6 py-4">
                        {p.status === "TRANSFERRED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{t.host.payoutStatusTransferred}</span>
                          </span>
                        )}
                        {p.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{t.host.payoutStatusPending}</span>
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {p.transferProofUrl ? (
                          <a
                            href={p.transferProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-brand-teal hover:underline font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{t.host.viewProof}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Accommodation Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl max-w-xl w-full shadow-2xl space-y-5 border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-brand-navy dark:text-white">
                {t.host.addAccommodation}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccommodation} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.host.accName} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="เช่น บ้านสวนริมธาร วิวดอยสุเทพ"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.host.accProvince} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="เช่น เชียงใหม่, น่าน"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.host.accMaxGuests} *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.host.accPrice} *
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={formData.pricePerNight}
                  onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                  placeholder="เช่น 1800"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.host.accAddress} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="ที่อยู่ ตำบล อำเภอ"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t.host.accDesc} *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="อธิบายจุดเด่น บรรยากาศ สิ่งอำนวยความสะดวก..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ลิงก์รูปภาพ (URL)
                </label>
                <input
                  type="url"
                  value={formData.imagesJson}
                  onChange={(e) => setFormData({ ...formData, imagesJson: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-brand-navy dark:text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl font-semibold text-white bg-brand-teal hover:bg-brand-teal-700 shadow-sm"
                >
                  {isSubmitting ? t.common.loading : t.host.submitAccommodation}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
