"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { VerifiedBadge, ScreeningBadge, RoleBadge } from "./StatusBadges";
import {
  Compass,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  PlusCircle,
  Luggage,
} from "lucide-react";

export function Navbar() {
  const { t } = useLanguage();
  const { user, logout, hasRole } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
    setMobileMenuOpen(false);
  };

  const isAdmin = hasRole("ADMIN");
  const isStaff = hasRole("STAFF");

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-navy dark:bg-brand-teal flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-all">
              <Compass className="w-6 h-6 text-brand-teal dark:text-brand-navy" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-brand-navy dark:text-white flex items-center gap-1.5">
                Together <span className="text-brand-teal">Go</span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                {t.brandSlogan}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-brand-teal bg-teal-50/70 dark:bg-teal-950/40"
                  : "text-slate-700 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {t.nav.home}
            </Link>

            {user && (
              <Link
                href="/my-trips"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/my-trips")
                    ? "text-brand-teal bg-teal-50/70 dark:bg-teal-950/40"
                    : "text-slate-700 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Luggage className="w-4 h-4 text-brand-teal" />
                <span>{t.nav.myTrips}</span>
              </Link>
            )}

            {user && (
              <Link
                href="/trips/new"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname === "/trips/new"
                    ? "text-brand-teal bg-teal-50/70 dark:bg-teal-950/40"
                    : "text-slate-700 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <PlusCircle className="w-4 h-4 text-brand-teal" />
                <span>{t.nav.createTrip}</span>
              </Link>
            )}

            {user && (
              <Link
                href="/host"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/host")
                    ? "text-brand-teal bg-teal-50/70 dark:bg-teal-950/40"
                    : "text-slate-700 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>{t.nav.host}</span>
              </Link>
            )}

            {user && (
              <Link
                href="/onboarding"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/onboarding")
                    ? "text-brand-teal bg-teal-50/70 dark:bg-teal-950/40"
                    : "text-slate-700 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-brand-teal" />
                <span>{t.nav.onboarding}</span>
                {user.onboardingStep < 5 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </Link>
            )}

            {user && (isAdmin || isStaff) && (
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  pathname.startsWith("/admin")
                    ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50"
                    : "text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>{t.nav.admin}</span>
              </Link>
            )}
          </nav>

          {/* Right Header Area (Language Switcher + Theme Toggle + Auth) */}
          <div className="hidden md:flex items-center gap-2.5">
            <LanguageSwitcher />
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
                {/* User Info & Badges */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-brand-navy dark:text-white">
                      {user.profile?.nickname || user.profile?.fullName || user.username}
                    </span>
                    {user.roles && user.roles.length > 0 && (
                      <RoleBadge role={user.roles[0].role} />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {user.isVerified && <VerifiedBadge isVerified size="sm" />}
                    {user.screeningStatus === "PASSED" && (
                      <ScreeningBadge status="PASSED" size="sm" />
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                  title={t.nav.logout}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  href="/auth"
                  className="px-4 py-2 text-sm font-medium text-brand-navy dark:text-white hover:text-brand-teal transition-colors"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/auth?tab=register"
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal-700 rounded-xl shadow-xs transition-all duration-200 hover:shadow"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher compact />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          {user && (
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-navy dark:text-white">
                    {user.profile?.fullName || user.username}
                  </span>
                  {user.roles && user.roles.length > 0 && (
                    <RoleBadge role={user.roles[0].role} />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <VerifiedBadge isVerified={user.isVerified} status={user.idCardStatus} size="sm" />
                  <ScreeningBadge status={user.screeningStatus} size="sm" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t.nav.home}
            </Link>

            {user && (
              <Link
                href="/my-trips"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Luggage className="w-5 h-5 text-brand-teal" />
                <span>{t.nav.myTrips}</span>
              </Link>
            )}

            {user && (
              <Link
                href="/trips/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <PlusCircle className="w-5 h-5 text-brand-teal" />
                <span>{t.nav.createTrip}</span>
              </Link>
            )}

            {user && (
              <Link
                href="/host"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {t.nav.host}
              </Link>
            )}

            {user && (
              <Link
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand-teal" />
                  <span>{t.nav.onboarding}</span>
                </div>
                {user.onboardingStep < 5 && (
                  <span className="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 font-semibold">
                    {t.common.step} {user.onboardingStep}/4
                  </span>
                )}
              </Link>
            )}

            {user && (isAdmin || isStaff) && (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
              >
                {t.nav.admin}
              </Link>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 font-medium hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.nav.logout}</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-brand-navy dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {t.nav.login}
                </Link>
                <Link
                  href="/auth?tab=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 px-4 rounded-xl bg-brand-teal text-white font-medium hover:bg-brand-teal-700"
                >
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
