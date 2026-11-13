"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Search, MapPin, Calendar, DollarSign, RotateCcw } from "lucide-react";

interface FilterProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedProvince: string;
  setSelectedProvince: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  priceRange: string;
  setPriceRange: (val: string) => void;
  onReset: () => void;
}

const PROVINCES = [
  "เชียงใหม่",
  "กระบี่",
  "กาญจนบุรี",
  "น่าน",
  "ภูเก็ต",
  "แม่ฮ่องสอน",
  "ประจวบคีรีขันธ์",
  "เพชรบูรณ์",
  "ชลบุรี",
  "สุราษฎร์ธานี",
];

export function TripFilters({
  searchTerm,
  setSearchTerm,
  selectedProvince,
  setSelectedProvince,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  priceRange,
  setPriceRange,
  onReset,
}: FilterProps) {
  const { t } = useLanguage();

  const isFiltered =
    Boolean(searchTerm) ||
    (selectedProvince && selectedProvince !== "all") ||
    Boolean(startDate) ||
    Boolean(endDate) ||
    (priceRange && priceRange !== "all");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t.trips.filterSearchPlaceholder}
          className="w-full pl-12 pr-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white transition-all"
        />
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Province Filter */}
        <div className="relative">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.trips.filterProvince}
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white cursor-pointer"
            >
              <option value="all">{t.trips.allProvinces}</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.trips.filterStartDate}
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white cursor-pointer"
            />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.trips.filterEndDate}
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white cursor-pointer"
            />
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {t.trips.filterPrice}
          </label>
          <div className="relative">
            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/40 dark:text-white cursor-pointer"
            >
              <option value="all">{t.trips.allPrices}</option>
              <option value="low">{t.trips.filterPriceLow}</option>
              <option value="med">{t.trips.filterPriceMed}</option>
              <option value="high">{t.trips.filterPriceHigh}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reset Filter Button */}
      {isFiltered && (
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.trips.resetFilter}</span>
          </button>
        </div>
      )}
    </div>
  );
}
