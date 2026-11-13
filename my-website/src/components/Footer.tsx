"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Compass, ShieldCheck, AlertCircle } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-brand-navy-950 dark:bg-black text-slate-300 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-teal flex items-center justify-center text-white shadow-md">
                <Compass className="w-6 h-6 text-brand-navy" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Together <span className="text-brand-teal">Go</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {t.brandSlogan}. แพลตฟอร์มท่องเที่ยวที่รวมคนแปลกหน้าที่ผ่านการยืนยันตัวตน 100%
              เน้นความปลอดภัย ความโปร่งใส และมิตรภาพที่แท้จริง
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-brand-teal-300">
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>PDPA Compliant • Secured Private Bucket Storage</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              นำทางด่วน
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/my-trips" className="hover:text-white transition-colors">
                  {t.nav.myTrips}
                </Link>
              </li>
              <li>
                <Link href="/trips/new" className="hover:text-white transition-colors">
                  {t.nav.createTrip}
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-white transition-colors">
                  {t.nav.onboarding}
                </Link>
              </li>
              <li>
                <Link href="/auth" className="hover:text-white transition-colors">
                  {t.nav.login}
                </Link>
              </li>
            </ul>
          </div>

          {/* Safety Notice & Medical Disclaimer */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              ความปลอดภัย & ฉุกเฉิน
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-start gap-2 text-amber-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>สายด่วนฉุกเฉินตลอด 24 ชม.</span>
              </div>
              <p>• เหตุด่วนเหตุร้าย: 191</p>
              <p>• การแพทย์ฉุกเฉิน: 1669</p>
              <p>• สายด่วนสุขภาพจิต: 1323</p>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800">
                *แบบประเมินสุขภาพจิตในระบบไม่ใช่การวินิจฉัยทางการแพทย์
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Together Go. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy (PDPA)</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Community Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
