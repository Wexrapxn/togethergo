"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { Compass, Lock, User, Mail, Sparkles, AlertCircle, ArrowRight } from "lucide-react";

function AuthForm() {
  const { t } = useLanguage();
  const { user, login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab = searchParams.get("tab") === "register" ? "register" : "login";
  const [tab, setTab] = useState<"login" | "register">(initialTab);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // UI state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.roles?.some((r) => r.role === "ADMIN")) {
        router.push("/admin");
      } else if (user.onboardingStep < 5) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    }
  }, [user, router]);

  // Quick fill admin credentials
  const fillAdminCredentials = () => {
    setTab("login");
    setLoginIdentifier("admin");
    setLoginPassword("1234");
    setErrorMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg(t.auth.errors.requiredField);
      return;
    }

    setIsSubmitting(true);
    const res = await login(loginIdentifier.trim(), loginPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || t.auth.errors.loginFailed);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg(t.auth.errors.requiredField);
      return;
    }

    if (regPassword.length < 4) {
      setErrorMsg(t.auth.errors.passwordMin);
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg(t.auth.errors.passwordMismatch);
      return;
    }

    setIsSubmitting(true);
    const res = await register(regUsername.trim(), regEmail.trim(), regPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.error || t.auth.errors.userExists);
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-brand-bg dark:bg-slate-950 transition-colors">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-navy dark:bg-brand-teal text-white shadow-lg shadow-brand-navy/15 mb-2">
            <Compass className="w-8 h-8 text-brand-teal dark:text-brand-navy" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-navy dark:text-white">
            {t.auth.title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t.auth.subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMsg(null);
              }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === "login"
                  ? "bg-white dark:bg-slate-900 text-brand-navy dark:text-brand-teal shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white"
              }`}
            >
              {t.auth.loginTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setErrorMsg(null);
              }}
              className={`py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === "register"
                  ? "bg-white dark:bg-slate-900 text-brand-navy dark:text-brand-teal shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-brand-navy dark:hover:text-white"
              }`}
            >
              {t.auth.registerTab}
            </button>
          </div>

          {/* Quick Admin Demo Box */}
          <div className="mb-6 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-brand-teal-800 dark:text-brand-teal-300">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <span>{t.auth.demoAdminNotice}</span>
              </div>
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="px-2.5 py-1 text-[11px] font-semibold bg-brand-teal text-white rounded-lg hover:bg-brand-teal-700 transition-colors shadow-2xs"
              >
                {t.auth.quickFillAdmin}
              </button>
            </div>
            <div className="mt-1.5 flex gap-4 text-slate-600 dark:text-slate-300">
              <span className="font-mono bg-white/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-teal-100 dark:border-slate-700">
                {t.auth.demoAdminUser}
              </span>
              <span className="font-mono bg-white/80 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-teal-100 dark:border-slate-700">
                {t.auth.demoAdminPass}
              </span>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.auth.emailOrUsername}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="admin หรือ your@email.com"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    {t.auth.password}
                  </label>
                  <span className="text-xs text-brand-teal hover:underline cursor-pointer">
                    {t.auth.forgotPassword}
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-4 rounded-xl text-white font-semibold bg-brand-navy hover:bg-brand-navy-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{t.common.loading}</span>
                ) : (
                  <>
                    <span>{t.auth.loginBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.auth.username}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="somchai_travel"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.auth.email}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="somchai@example.com"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.auth.password}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="อย่างน้อย 4 ตัวอักษร"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.auth.confirmPassword}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                    className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 px-4 rounded-xl text-white font-semibold bg-brand-teal hover:bg-brand-teal-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{t.common.loading}</span>
                ) : (
                  <>
                    <span>{t.auth.registerBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            {t.auth.termsNotice}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
