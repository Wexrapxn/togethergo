"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  Luggage,
  Calendar,
  MapPin,
  PlusCircle,
  ArrowRight,
  UserCheck,
} from "lucide-react";

export default function MyTripsPage() {
  const { t, locale } = useLanguage();
  const { user, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"created" | "joined">("created");
  const [createdTrips, setCreatedTrips] = useState<any[]>([]);
  const [joinedTrips, setJoinedTrips] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      fetch("/api/my-trips")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setCreatedTrips(data.createdTrips || []);
            setJoinedTrips(data.joinedTrips || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingData(false));
    }
  }, [user, loading, router]);

  if (loading || loadingData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-brand-navy dark:text-white tracking-tight flex items-center gap-3">
            <Luggage className="w-8 h-8 text-brand-teal" />
            <span>{t.trips.myTrips.pageTitle}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.trips.myTrips.pageSubtitle}
          </p>
        </div>

        <Link
          href="/trips/new"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white bg-brand-teal hover:bg-brand-teal-700 shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.nav.createTrip}</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 sm:gap-8">
        <button
          type="button"
          onClick={() => setActiveTab("created")}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === "created"
              ? "text-brand-teal border-b-2 border-brand-teal"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <span>{t.trips.myTrips.createdTab}</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            {createdTrips.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("joined")}
          className={`pb-3 text-sm font-semibold transition-all relative ${
            activeTab === "joined"
              ? "text-brand-teal border-b-2 border-brand-teal"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <span>{t.trips.myTrips.joinedTab}</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
            {joinedTrips.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Created Trips */}
      {activeTab === "created" && (
        <div className="space-y-4">
          {createdTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {createdTrips.map((trip) => {
                const startFormatted = new Date(trip.startDate).toLocaleDateString(
                  locale === "th" ? "th-TH" : "en-US",
                  { day: "numeric", month: "short", year: "2-digit" }
                );
                const endFormatted = new Date(trip.endDate).toLocaleDateString(
                  locale === "th" ? "th-TH" : "en-US",
                  { day: "numeric", month: "short", year: "2-digit" }
                );
                const approvedCount = trip.members.filter(
                  (m: any) => m.status === "APPROVED" || m.status === "PAID"
                ).length;
                const requestedCount = trip.members.filter(
                  (m: any) => m.status === "REQUESTED"
                ).length;

                return (
                  <div
                    key={trip.id}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-navy/10 dark:bg-slate-800 text-brand-navy dark:text-brand-teal">
                          <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                          <span>{trip.province}</span>
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-brand-teal border border-teal-200 dark:border-teal-800">
                          {trip.status === "OPEN" ? "เปิดรับสมาชิก" : trip.status}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-brand-navy dark:text-white line-clamp-1">
                        {trip.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-teal" />
                        <span>
                          {startFormatted} — {endFormatted}
                        </span>
                      </p>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300">
                          สมาชิก: <strong>{approvedCount}</strong> / {trip.maxMembers} คน
                        </span>

                        {requestedCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-[11px] animate-pulse">
                            มีคำขอเข้าร่วม {requestedCount} คน
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline"
                      >
                        <span>จัดการและดูรายละเอียดทริป</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t.trips.myTrips.noCreatedTrips}
              </p>
              <Link
                href="/trips/new"
                className="inline-block py-2.5 px-6 rounded-xl font-semibold bg-brand-teal text-white text-xs"
              >
                {t.trips.myTrips.createFirstBtn}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Joined Trips */}
      {activeTab === "joined" && (
        <div className="space-y-4">
          {joinedTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {joinedTrips.map((item, idx) => {
                const trip = item.trip;
                const startFormatted = new Date(trip.startDate).toLocaleDateString(
                  locale === "th" ? "th-TH" : "en-US",
                  { day: "numeric", month: "short", year: "2-digit" }
                );
                const endFormatted = new Date(trip.endDate).toLocaleDateString(
                  locale === "th" ? "th-TH" : "en-US",
                  { day: "numeric", month: "short", year: "2-digit" }
                );

                const isApproved = item.membershipStatus === "APPROVED" || item.membershipStatus === "PAID";

                return (
                  <div
                    key={trip.id || idx}
                    className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-navy/10 dark:bg-slate-800 text-brand-navy dark:text-brand-teal">
                          <MapPin className="w-3.5 h-3.5 text-brand-teal" />
                          <span>{trip.province}</span>
                        </span>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isApproved
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {isApproved
                            ? t.trips.detail.memberStatusApproved
                            : t.trips.detail.memberStatusRequested}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg text-brand-navy dark:text-white line-clamp-1">
                        {trip.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-brand-teal" />
                        <span>
                          {startFormatted} — {endFormatted}
                        </span>
                      </p>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-brand-teal" />
                          <span>{t.trips.myTrips.roleInTrip}</span>
                        </span>
                        <span className="font-semibold text-brand-navy dark:text-white">
                          {item.userRole || t.trips.myTrips.noRoleAssigned}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link
                        href={`/trips/${trip.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-teal hover:underline"
                      >
                        <span>{t.trips.viewTripBtn}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t.trips.myTrips.noJoinedTrips}
              </p>
              <Link
                href="/#explore"
                className="inline-block py-2.5 px-6 rounded-xl font-semibold bg-brand-navy dark:bg-brand-teal text-white text-xs"
              >
                {t.trips.myTrips.browseTripsBtn}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
