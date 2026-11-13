"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { VerifiedBadge, ScreeningBadge } from "@/components/StatusBadges";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

export interface TripCardData {
  id: string;
  title: string;
  description: string;
  province: string;
  coverImage?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  maxMembers: number;
  nights?: number;
  days?: number;
  costBreakdown?: {
    accPerPerson: number;
    fuelPerPerson: number;
    platformFee: number;
    totalEstimatedCost: number;
  };
  approvedMembersCount?: number;
  seatsLeft?: number;
  creator: {
    id: string;
    username: string;
    isVerified: boolean;
    screeningStatus: string;
    profile?: {
      fullName?: string | null;
      nickname?: string | null;
      avatarUrl?: string | null;
    } | null;
  };
}

export function TripCard({ trip }: { trip: TripCardData }) {
  const { t, locale } = useLanguage();

  const startDateFormatted = new Date(trip.startDate).toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { day: "numeric", month: "short", year: "2-digit" }
  );

  const endDateFormatted = new Date(trip.endDate).toLocaleDateString(
    locale === "th" ? "th-TH" : "en-US",
    { day: "numeric", month: "short", year: "2-digit" }
  );

  const fallbackImage =
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

  return (
    <div className="group rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col overflow-hidden">
      {/* Cover Image & Badges */}
      <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={trip.coverImage || fallbackImage}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-black/20" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-navy/90 text-white backdrop-blur-md shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-brand-teal" />
            <span>{trip.province}</span>
          </span>
        </div>

        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
            <Users className="w-3.5 h-3.5" />
            <span>
              {t.trips.tripCard.seatsLeft} {trip.seatsLeft ?? trip.maxMembers}
            </span>
          </span>
        </div>

        {/* Date Bottom Overlay on Image */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5 font-medium backdrop-blur-xs bg-black/40 px-2 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-brand-teal" />
            <span>
              {startDateFormatted} - {endDateFormatted}
            </span>
          </div>

          {trip.nights !== undefined && (
            <span className="font-semibold bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg">
              {trip.days} {t.trips.tripCard.days} {trip.nights} {t.trips.tripCard.nights}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-bold text-base sm:text-lg text-brand-navy dark:text-white group-hover:text-brand-teal transition-colors line-clamp-1">
            {trip.title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {trip.description}
          </p>
        </div>

        {/* Creator Info */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-navy/10 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-brand-navy dark:text-brand-teal">
              {trip.creator.profile?.nickname?.[0] || trip.creator.username[0].toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-brand-navy dark:text-slate-200">
                {trip.creator.profile?.nickname || trip.creator.profile?.fullName || trip.creator.username}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {trip.creator.isVerified && <VerifiedBadge isVerified size="sm" />}
            {trip.creator.screeningStatus === "PASSED" && (
              <ScreeningBadge status="PASSED" size="sm" />
            )}
          </div>
        </div>

        {/* Cost & Action */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-slate-400 block font-normal">
              {t.trips.tripCard.estCost}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-brand-teal">
                ฿{trip.costBreakdown?.totalEstimatedCost.toLocaleString() || "0"}
              </span>
              <span className="text-[11px] text-slate-400">
                {t.trips.tripCard.perPerson}
              </span>
            </div>
          </div>

          <Link
            href={`/trips/${trip.id}`}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-navy dark:bg-brand-teal hover:bg-brand-navy-800 dark:hover:bg-brand-teal-700 transition-all shadow-xs group-hover:gap-1.5"
          >
            <span>{t.trips.viewTripBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
