"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Compass,
  ShieldCheck,
  Fuel,
  Home,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface AccommodationOption {
  id: string;
  name: string;
  province: string;
  pricePerNight: number;
  maxGuests: number;
  description: string;
}

export default function CreateTripPage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  // Form states
  const [title, setTitle] = useState("");
  const [province, setProvince] = useState("เชียงใหม่");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxMembers, setMaxMembers] = useState(4);
  const [coverImage, setCoverImage] = useState("");
  const [description, setDescription] = useState("");

  // Accommodation
  const [accommodations, setAccommodations] = useState<AccommodationOption[]>([]);
  const [selectedAccId, setSelectedAccId] = useState<string>("");

  // Fuel calculation
  const [distanceKm, setDistanceKm] = useState<number>(300);
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(36.5);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch accommodations
  useEffect(() => {
    fetch("/api/accommodations")
      .then((res) => res.json())
      .then((data) => {
        if (data.accommodations) {
          setAccommodations(data.accommodations);
        }
      })
      .catch(console.error);
  }, []);

  // Compute live costs
  const selectedAcc = accommodations.find((a) => a.id === selectedAccId);
  const nights =
    startDate && endDate
      ? Math.max(
          1,
          Math.round(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 2;

  const validMembers = Math.max(1, maxMembers);
  const accTotal = selectedAcc ? selectedAcc.pricePerNight * nights : 0;
  const accPerPerson = Math.round(accTotal / validMembers);

  const fuelTotal = distanceKm * fuelPricePerLiter;
  const fuelPerPerson = Math.round(fuelTotal / validMembers);

  const platformFee = 50;
  const totalEstPerPerson = accPerPerson + fuelPerPerson + platformFee;

  const isUserVerified =
    user?.isVerified ||
    user?.roles?.some((r) => r.role === "ADMIN" || r.role === "STAFF");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !province.trim() || !startDate || !endDate || !description.trim()) {
      setErrorMsg(t.auth.errors.requiredField);
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg("วันสิ้นสุดต้องอยู่หลังวันเริ่มต้นการเดินทาง");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          province,
          description,
          startDate,
          endDate,
          maxMembers: validMembers,
          coverImage: coverImage || undefined,
          accommodationId: selectedAccId || undefined,
          totalFuelDistance: distanceKm,
          fuelPricePerLiter,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create trip");
      }

      router.push(`/trips/${data.tripId}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-slate-800 text-amber-600 flex items-center justify-center mx-auto">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-brand-navy dark:text-white">
          กรุณาเข้าสู่ระบบก่อนสร้างทริป
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          คุณต้องมีบัญชีผู้ใช้งานที่ได้รับการยืนยันตัวตนแล้วจึงจะสามารถเปิดทริปท่องเที่ยวได้
        </p>
        <Link
          href="/auth"
          className="inline-block py-3 px-6 rounded-xl font-semibold bg-brand-navy dark:bg-brand-teal text-white"
        >
          {t.nav.login}
        </Link>
      </div>
    );
  }

  // Verification Gate Check
  if (!isUserVerified) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-card text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-brand-navy dark:text-white">
              {t.trips.create.verifiedGateTitle}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              {t.trips.create.verifiedGateDesc}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto text-left space-y-2">
            <p className="font-semibold text-brand-navy dark:text-white">
              สถานะปัจจุบันของคุณ:
            </p>
            <p>• ยืนยันบัตรประชาชน: {user.idCardStatus}</p>
            <p>• แบบประเมินสุขภาพจิต: {user.screeningStatus}</p>
          </div>

          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 py-3.5 px-8 rounded-xl font-semibold text-white bg-brand-navy dark:bg-brand-teal hover:bg-brand-navy-800 dark:hover:bg-brand-teal-700 shadow-md"
          >
            <span>{t.trips.create.goToVerifyBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-brand-navy dark:text-white tracking-tight">
          {t.trips.create.pageTitle}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
          {t.trips.create.pageSubtitle}
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: General Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-5">
          <h2 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2 border-l-4 border-brand-teal pl-3">
            <Compass className="w-5 h-5 text-brand-teal" />
            <span>{t.trips.create.tripInfoSection}</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.trips.create.titleLabel} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.trips.create.titlePlaceholder}
              className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.trips.create.provinceLabel} *
              </label>
              <input
                type="text"
                required
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder={t.trips.create.provincePlaceholder}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.trips.create.maxMembersLabel} *
              </label>
              <input
                type="number"
                min={2}
                max={12}
                required
                value={maxMembers}
                onChange={(e) => setMaxMembers(parseInt(e.target.value) || 2)}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.trips.create.startDateLabel} *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.trips.create.endDateLabel} *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.trips.create.coverImageLabel}
            </label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder={t.trips.create.coverImagePlaceholder}
              className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.trips.create.descLabel} *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.trips.create.descPlaceholder}
              className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
            />
          </div>
        </div>

        {/* Section 2: Accommodation Selection */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-5">
          <h2 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2 border-l-4 border-sky-500 pl-3">
            <Home className="w-5 h-5 text-sky-500" />
            <span>{t.trips.create.accommodationSection}</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {t.trips.create.selectAccommodation}
            </label>
            <select
              value={selectedAccId}
              onChange={(e) => setSelectedAccId(e.target.value)}
              className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white cursor-pointer"
            >
              <option value="">{t.trips.create.noAccommodationOption}</option>
              {accommodations.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.province}) — ฿{acc.pricePerNight.toLocaleString()}/คืน (รับสูงสุด {acc.maxGuests} คน)
                </option>
              ))}
            </select>
          </div>

          {selectedAcc && (
            <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-brand-navy dark:text-white text-sm">
                  {selectedAcc.name}
                </span>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  ฿{selectedAcc.pricePerNight.toLocaleString()} / คืน
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {selectedAcc.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                คำนวณ {nights} คืน สำหรับสมาชิก {validMembers} คน: ตกคนละ{" "}
                <strong className="text-brand-navy dark:text-white">
                  ฿{accPerPerson.toLocaleString()}
                </strong>
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Fuel Calculation */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-5">
          <h2 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2 border-l-4 border-amber-500 pl-3">
            <Fuel className="w-5 h-5 text-amber-500" />
            <span>{t.trips.create.costCalculationSection}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.trips.create.fuelDistanceLabel}
              </label>
              <input
                type="number"
                min={0}
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                {t.trips.create.fuelPriceLabel}
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={fuelPricePerLiter}
                onChange={(e) => setFuelPricePerLiter(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white"
              />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <p className="font-semibold">{t.trips.create.fuelEstimateNotice}</p>
            <p className="opacity-90">{t.trips.create.fuelPayNotice}</p>
          </div>

          {/* Cost Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-bold text-sm text-brand-navy dark:text-white">
              {t.trips.create.costSummaryTitle}
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>{t.trips.create.estAccPerPerson}</span>
                <span className="font-semibold text-brand-navy dark:text-white">฿{accPerPerson.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.trips.create.estFuelPerPerson}</span>
                <span className="font-semibold text-brand-navy dark:text-white">฿{fuelPerPerson.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.trips.create.platformFee}</span>
                <span className="font-semibold text-brand-navy dark:text-white">฿{platformFee}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-brand-teal">
                <span>{t.trips.create.totalEstPerPerson}</span>
                <span>฿{totalEstPerPerson.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-brand-teal hover:bg-brand-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-base"
        >
          {isSubmitting ? (
            <span>{t.trips.create.creating}</span>
          ) : (
            <>
              <span>{t.trips.create.submitTripBtn}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
