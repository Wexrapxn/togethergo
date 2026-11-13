"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Clock, AlertTriangle, XCircle, HeartHandshake } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface BadgeProps {
  size?: "sm" | "md" | "lg";
  showDesc?: boolean;
  className?: string;
}

/**
 * ป้ายสถานะ "ยืนยันตัวตนแล้ว" (ID Verified)
 * สีน้ำเงินเข้ม (#0F294A) + เขียวอมฟ้า (#0D9488) เพื่อสื่อถึงความน่าเชื่อถือและความปลอดภัย
 */
export function VerifiedBadge({
  isVerified,
  status = "NOT_SUBMITTED",
  size = "md",
  showDesc = false,
  className = "",
}: BadgeProps & { isVerified?: boolean; status?: string }) {
  const { t } = useLanguage();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-xs gap-1.5 font-medium",
    lg: "px-4 py-2 text-sm gap-2 font-semibold",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (isVerified || status === "APPROVED") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className={`inline-flex items-center rounded-full bg-brand-teal/10 dark:bg-brand-teal/20 text-brand-teal dark:text-brand-teal-300 border border-brand-teal/30 shadow-xs ${sizeClasses[size]}`}
          title={t.badges.idVerifiedDesc}
        >
          <CheckCircle2 className={`${iconSizes[size]} text-brand-teal dark:text-brand-teal-300 fill-brand-teal/20`} />
          <span>{t.badges.idVerified}</span>
        </span>
        {showDesc && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1">
            {t.badges.idVerifiedDesc}
          </span>
        )}
      </div>
    );
  }

  if (status === "PENDING") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className={`inline-flex items-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 shadow-xs ${sizeClasses[size]}`}
        >
          <Clock className={`${iconSizes[size]} text-amber-600 dark:text-amber-400`} />
          <span>{t.badges.pendingReview}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className={`inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClasses[size]}`}
      >
        <ShieldCheck className={`${iconSizes[size]} text-slate-400 dark:text-slate-500`} />
        <span>{t.badges.notVerified}</span>
      </span>
    </div>
  );
}

/**
 * ป้ายสถานะ "ผ่านแบบประเมิน" (Screening Passed)
 * สื่อถึงการผ่านการประเมินความพร้อมและสุขภาพจิตเบื้องต้น
 */
export function ScreeningBadge({
  status,
  size = "md",
  showDesc = false,
  className = "",
}: BadgeProps & { status: string }) {
  const { t } = useLanguage();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-xs gap-1.5 font-medium",
    lg: "px-4 py-2 text-sm gap-2 font-semibold",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (status === "PASSED") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className={`inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs ${sizeClasses[size]}`}
          title={t.badges.screeningPassedDesc}
        >
          <HeartHandshake className={`${iconSizes[size]} text-emerald-600 dark:text-emerald-400`} />
          <span>{t.badges.screeningPassed}</span>
        </span>
        {showDesc && (
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-1">
            {t.badges.screeningPassedDesc}
          </span>
        )}
      </div>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className={`inline-flex items-center rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 ${sizeClasses[size]}`}
        >
          <Clock className={`${iconSizes[size]} text-sky-600 dark:text-sky-400`} />
          <span>{t.badges.screeningReview}</span>
        </span>
      </div>
    );
  }

  if (status === "FAILED") {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <span
          className={`inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 ${sizeClasses[size]}`}
        >
          <XCircle className={`${iconSizes[size]} text-rose-600 dark:text-rose-400`} />
          <span>{t.badges.riskHigh}</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className={`inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClasses[size]}`}
      >
        <AlertTriangle className={`${iconSizes[size]} text-slate-400 dark:text-slate-500`} />
        <span>{t.common.loading}</span>
      </span>
    </div>
  );
}

/**
 * Role badge for Admin, Staff, Host, User
 */
export function RoleBadge({ role }: { role: string }) {
  const upper = role.toUpperCase();
  if (upper === "ADMIN") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        ADMIN
      </span>
    );
  }
  if (upper === "STAFF") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        STAFF
      </span>
    );
  }
  if (upper === "HOST") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
        HOST
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
      MEMBER
    </span>
  );
}
