"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  HeartHandshake,
  MapPin,
  ArrowRight,
  CheckCircle2,
  LifeBuoy,
  PlusCircle,
  Compass,
} from "lucide-react";
import { VerifiedBadge, ScreeningBadge } from "@/components/StatusBadges";
import { TripCard, TripCardData } from "@/components/TripCard";
import { TripFilters } from "@/components/TripFilters";

export default function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Trips state
  const [trips, setTrips] = useState<TripCardData[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceRange, setPriceRange] = useState("all");

  const fetchTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedProvince && selectedProvince !== "all") params.append("province", selectedProvince);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (priceRange && priceRange !== "all") params.append("price", priceRange);

      const res = await fetch(`/api/trips?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTrips(data.trips || []);
      }
    } catch (err) {
      console.error("Fetch trips error:", err);
    } finally {
      setLoadingTrips(false);
    }
  }, [searchTerm, selectedProvince, startDate, endDate, priceRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTrips();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTrips]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedProvince("all");
    setStartDate("");
    setEndDate("");
    setPriceRange("all");
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 bg-linear-to-b from-white via-brand-bg to-brand-bg dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-800 text-brand-teal text-xs sm:text-sm font-semibold shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                <span>{t.home.heroTag}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-navy dark:text-white leading-tight">
                {t.home.heroTitle} <br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-brand-teal to-teal-500">
                  {t.home.heroHighlight}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t.home.heroSubtitle}
              </p>

              {/* Status Badges Showcase */}
              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  มาตรฐานความปลอดภัย:
                </span>
                <VerifiedBadge isVerified size="md" />
                <ScreeningBadge status="PASSED" size="md" />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  href="/trips/new"
                  className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-semibold text-white bg-brand-teal hover:bg-brand-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-base"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>{t.nav.createTrip}</span>
                </Link>

                {!user && (
                  <Link
                    href="/auth"
                    className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-semibold text-brand-navy dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-all shadow-xs flex items-center justify-center gap-2 text-base"
                  >
                    <span>{t.nav.login} (ทดสอบ Admin)</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column: Hero Preview Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md">
                <div className="absolute -inset-1.5 bg-linear-to-r from-brand-navy via-brand-teal to-teal-400 rounded-3xl blur-xl opacity-20" />

                <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-card border border-slate-200/80 dark:border-slate-800 space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-navy/5 dark:bg-slate-800 border border-brand-navy/10 flex items-center justify-center text-brand-navy dark:text-brand-teal font-bold text-lg">
                        TG
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-navy dark:text-white">
                          มาตรฐานชุมชน Together Go
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          เดินทางร่วมกันอย่างมั่นใจ ไร้กังวล
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          การยืนยันตัวตน (ID):
                        </span>
                        <VerifiedBadge isVerified size="sm" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          สุขภาพจิต & ความพร้อม:
                        </span>
                        <ScreeningBadge status="PASSED" size="sm" />
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 leading-relaxed">
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                        <span>สมาชิกยืนยันตัวตนจริง 100% ตรวจสอบได้</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                        <span>คัดกรองความพร้อมทางอารมณ์ ลดความขัดแย้ง</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                        <span>ค่าที่พักหารเท่า ค่าน้ำมันคิดตามระยะทางจริง</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs text-brand-teal-900 dark:text-brand-teal-300 font-medium text-center">
                    🔒 ปลอดภัยด้วยระบบคิดคะแนนฝั่ง Server และเข้ารหัสข้อมูล PDPA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trips Search & Exploration Section (Phase 2 Core) */}
      <section id="explore" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-brand-teal text-xs font-semibold mb-2">
              <Compass className="w-4 h-4" />
              <span>{t.trips.browseTitle}</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-bold text-brand-navy dark:text-white tracking-tight">
              ทริปท่องเที่ยวที่เปิดรับเพื่อนร่วมทาง
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.trips.browseSubtitle}
            </p>
          </div>

          <Link
            href="/trips/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-brand-navy dark:bg-brand-teal hover:bg-brand-navy-800 dark:hover:bg-brand-teal-700 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.nav.createTrip}</span>
          </Link>
        </div>

        {/* Filter Component */}
        <TripFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedProvince={selectedProvince}
          setSelectedProvince={setSelectedProvince}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          onReset={handleResetFilters}
        />

        {/* Trips Counter & Results */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>
            {t.trips.foundTrips} <strong className="text-brand-navy dark:text-white font-bold">{trips.length}</strong> {t.trips.tripsUnit}
          </span>
        </div>

        {/* Trips Grid */}
        {loadingTrips ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {t.common.loading}
            </p>
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-soft max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-slate-800 text-brand-teal flex items-center justify-center mx-auto">
              <Compass className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy dark:text-white">
              {t.trips.noTripsFound}
            </h3>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                {t.trips.resetFilter}
              </button>
              <Link
                href="/trips/new"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-teal text-white hover:bg-brand-teal-700"
              >
                {t.trips.createFirstTrip}
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* User Onboarding Quick Tracker (if logged in and not completed) */}
      {user && user.onboardingStep < 5 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-soft border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-brand-navy dark:text-white flex items-center gap-2">
                  <span>ยินดีต้อนรับคุณ,</span>
                  <span className="text-brand-teal">
                    {user.profile?.fullName || user.username}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  กรุณาทำขั้นตอนยืนยันตัวตนเพื่อปลดล็อคการสร้างและขอเข้าร่วมทริป
                </p>
              </div>

              <div className="flex items-center gap-2">
                <VerifiedBadge isVerified={user.isVerified} status={user.idCardStatus} size="sm" />
                <ScreeningBadge status={user.screeningStatus} size="sm" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-teal hover:underline"
              >
                <span>ทำขั้นตอนยืนยันตัวตนต่อ (ขั้นที่ {user.onboardingStep}/4)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Core Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-brand-navy dark:text-white tracking-tight">
            {t.home.featuresTitle}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            ออกแบบทุกฟีเจอร์เพื่อสร้างประสบการณ์ท่องเที่ยวที่ดีที่สุดสำหรับทุกคน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-200 dark:border-slate-700 flex items-center justify-center text-brand-teal">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy dark:text-white">
              {t.home.features.f1Title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.home.features.f1Desc}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy dark:text-white">
              {t.home.features.f2Title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.home.features.f2Desc}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy dark:text-white">
              {t.home.features.f3Title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.home.features.f3Desc}
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <LifeBuoy className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-brand-navy dark:text-white">
              {t.home.features.f4Title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.home.features.f4Desc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
