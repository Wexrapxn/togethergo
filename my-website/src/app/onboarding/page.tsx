"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ShieldCheck,
  FileText,
  User,
  Upload,
  HeartHandshake,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Camera,
  Trash2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { VerifiedBadge, ScreeningBadge } from "@/components/StatusBadges";

// 9 screening questions for group travel emotional well-being & harmony
const SCREENING_QUESTIONS = [
  {
    id: 1,
    th: "1. รู้สึกเบื่อหน่าย หรือไม่เพลิดเพลินในการทำกิจกรรมต่างๆ",
    en: "1. Little interest or pleasure in doing activities",
  },
  {
    id: 2,
    th: "2. รู้สึกไม่สบายใจ ซึมเศร้า หรือท้อแท้",
    en: "2. Feeling down, depressed, or hopeless",
  },
  {
    id: 3,
    th: "3. หลับยาก หลับๆ ตื่นๆ หรือหลับมากเกินไปจนกระทบต่อกิจวัตร",
    en: "3. Trouble falling or staying asleep, or sleeping too much",
  },
  {
    id: 4,
    th: "4. รู้สึกเหนื่อยง่าย หรือไม่มีเรี่ยวแรงทำกิจกรรม",
    en: "4. Feeling tired or having little energy",
  },
  {
    id: 5,
    th: "5. เบื่ออาหาร หรือกินอาหารมากเกินไปจนผิดปกติ",
    en: "5. Poor appetite or overeating",
  },
  {
    id: 6,
    th: "6. รู้สึกไม่ดีกับตัวเอง คิดว่าตัวเองล้มเหลว หรือทำให้ตนเองและครอบครัวผิดหวัง",
    en: "6. Feeling bad about yourself — or that you are a failure",
  },
  {
    id: 7,
    th: "7. สมาธิไม่ดีเวลาทำสิ่งต่างๆ เช่น ดูโทรทัศน์ หรือฟังการสนทนา",
    en: "7. Trouble concentrating on things, such as reading or conversations",
  },
  {
    id: 8,
    th: "8. ทำอะไรช้าลงจนคนอื่นสังเกตได้ หรือกระสับกระส่ายจนอยู่นิ่งไม่ได้",
    en: "8. Moving or speaking slowly, or being fidgety/restless",
  },
  {
    id: 9,
    th: "9. มีความคิดทำร้ายตัวเอง หรือคิดว่าถ้าตายไปคงจะดีกว่า (คำถามเพื่อการดูแลความปลอดภัยอย่างทันท่วงที)",
    en: "9. Thoughts that you would be better off dead, or of hurting yourself in some way",
  },
];

export default function OnboardingPage() {
  const { t, locale } = useLanguage();
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [activeStep, setActiveStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: PDPA
  const [pdpaAgreed, setPdpaAgreed] = useState(false);

  // Step 2: Profile & Emergency Contact
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [birthDate, setBirthDate] = useState("");
  const [bio, setBio] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("PARENT");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyAltPhone, setEmergencyAltPhone] = useState("");

  // Step 3: ID Verification
  const [idCardNumber, setIdCardNumber] = useState("");
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  // Step 4: Screening
  const [answers, setAnswers] = useState<number[]>(Array(9).fill(-1));
  const [screeningResult, setScreeningResult] = useState<any>(null);
  const [cooldownData, setCooldownData] = useState<{
    hasAttempted: boolean;
    cooldownActive: boolean;
    remainingHours?: number;
    nextEligibleDate?: string;
    latestStatus?: string;
  } | null>(null);

  // Check auth and prefill data
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      setActiveStep(Math.min(user.onboardingStep, 5));

      // Prefill Profile
      if (user.profile) {
        setFullName(user.profile.fullName || "");
        setNickname(user.profile.nickname || "");
        setPhone(user.profile.phone || "");
        setGender(user.profile.gender || "MALE");
        if (user.profile.birthDate) {
          setBirthDate(new Date(user.profile.birthDate).toISOString().split("T")[0]);
        }
        setBio(user.profile.bio || "");
      }

      // Prefill Emergency Contact
      if (user.emergencyContacts && user.emergencyContacts.length > 0) {
        const contact = user.emergencyContacts[0];
        setEmergencyName(contact.name || "");
        setEmergencyRelationship(contact.relationship || "PARENT");
        setEmergencyPhone(contact.phone || "");
        setEmergencyAltPhone(contact.altPhone || "");
      }
    }
  }, [user, loading, router]);

  // Check screening cooldown status when reaching step 4 or 5
  useEffect(() => {
    if (user && (activeStep === 4 || activeStep === 5)) {
      fetch("/api/onboarding/screening")
        .then((res) => res.json())
        .then((data) => setCooldownData(data))
        .catch(console.error);
    }
  }, [user, activeStep]);

  // Step 1: Submit PDPA
  const handlePdpaSubmit = async () => {
    if (!pdpaAgreed) {
      setErrorMsg(t.onboarding.pdpa.acceptCheckbox);
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/pdpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreed: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      setActiveStep(2);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Submit Profile & Emergency
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !emergencyName || !emergencyPhone) {
      setErrorMsg(t.auth.errors.requiredField);
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          nickname,
          phone,
          gender,
          birthDate,
          bio,
          emergencyName,
          emergencyRelationship,
          emergencyPhone,
          emergencyAltPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshUser();
      setActiveStep(3);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Handle File Uploads & ID verification
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "card" | "selfie"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "card") {
      setIdCardFile(file);
      setIdCardPreview(URL.createObjectURL(file));
    } else {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "File upload failed");
    return data.fileUrl;
  };

  const handleIdVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idCardNumber || (!idCardFile && !user?.verificationDocuments?.some(d => d.documentType === "IDCARD"))) {
      setErrorMsg(t.auth.errors.requiredField);
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      let cardUrl = "/uploads/mock-idcard.jpg";
      let selfieUrl = "/uploads/mock-selfie.jpg";

      if (idCardFile) {
        cardUrl = await uploadFile(idCardFile, "IDCARD");
      }
      if (selfieFile) {
        selfieUrl = await uploadFile(selfieFile, "SELFIE_WITH_IDCARD");
      }

      const res = await fetch("/api/onboarding/id-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCardNumber,
          cardFileUrl: cardUrl,
          selfieFileUrl: selfieUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      await refreshUser();
      setActiveStep(4);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 4: Mental Health Assessment Submit
  const handleScoreSelect = (questionIndex: number, score: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = score;
    setAnswers(newAnswers);
  };

  const handleScreeningSubmit = async () => {
    if (answers.some((a) => a === -1)) {
      setErrorMsg(t.onboarding.assessment.instruction);
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/onboarding/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Screening evaluation failed");

      setScreeningResult(data);
      await refreshUser();
      setActiveStep(5);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Top Header */}
      <div className="text-center space-y-2 mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-brand-teal text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>{t.onboarding.badge}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-brand-navy tracking-tight">
          {t.onboarding.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
          {t.onboarding.subtitle}
        </p>
      </div>

      {/* Progress Bar / Step Tabs */}
      <div className="mb-10">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { num: 1, label: t.onboarding.steps.step1, icon: FileText },
            { num: 2, label: t.onboarding.steps.step2, icon: User },
            { num: 3, label: t.onboarding.steps.step3, icon: Upload },
            { num: 4, label: t.onboarding.steps.step4, icon: HeartHandshake },
          ].map((step) => {
            const Icon = step.icon;
            const isCompleted = (user?.onboardingStep || 1) > step.num;
            const isCurrent = activeStep === step.num;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if ((user?.onboardingStep || 1) >= step.num || step.num <= activeStep) {
                    setActiveStep(step.num);
                    setErrorMsg(null);
                  }
                }}
                className={`relative flex flex-col items-center p-3 sm:p-4 rounded-2xl border text-center transition-all ${
                  isCurrent
                    ? "bg-white border-brand-teal shadow-md ring-2 ring-brand-teal/20"
                    : isCompleted
                    ? "bg-teal-50/50 border-teal-200 text-brand-teal hover:bg-teal-50"
                    : "bg-slate-50/70 border-slate-200 text-slate-400 opacity-70"
                }`}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 transition-colors ${
                    isCurrent
                      ? "bg-brand-navy text-white shadow-sm"
                      : isCompleted
                      ? "bg-brand-teal text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-semibold leading-tight line-clamp-2">
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: PDPA */}
      {activeStep === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-card border border-slate-200/80 space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-brand-teal" />
              <span>{t.onboarding.pdpa.title}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t.onboarding.pdpa.subtitle}
            </p>
          </div>

          <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4 text-sm text-slate-700 leading-relaxed max-h-[380px] overflow-y-auto">
            <h4 className="font-semibold text-brand-navy">
              {t.onboarding.pdpa.noticeHeading}
            </h4>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-brand-navy mb-1">
                  {t.onboarding.pdpa.point1Title}
                </p>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {t.onboarding.pdpa.point1Desc}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-brand-navy mb-1">
                  {t.onboarding.pdpa.point2Title}
                </p>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {t.onboarding.pdpa.point2Desc}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-brand-navy mb-1">
                  {t.onboarding.pdpa.point3Title}
                </p>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {t.onboarding.pdpa.point3Desc}
                </p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <p className="font-semibold text-brand-navy mb-1">
                  {t.onboarding.pdpa.point4Title}
                </p>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {t.onboarding.pdpa.point4Desc}
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 p-4 bg-teal-50/60 border border-teal-200 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors">
            <input
              type="checkbox"
              checked={pdpaAgreed}
              onChange={(e) => setPdpaAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 rounded text-brand-teal focus:ring-brand-teal border-slate-300"
            />
            <span className="text-sm font-medium text-brand-navy select-none">
              {t.onboarding.pdpa.acceptCheckbox}
            </span>
          </label>

          <div className="flex items-center justify-end pt-4">
            <button
              type="button"
              onClick={handlePdpaSubmit}
              disabled={isSubmitting || !pdpaAgreed}
              className="py-3.5 px-8 rounded-xl font-semibold text-white bg-brand-navy hover:bg-brand-navy-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <span>{t.onboarding.pdpa.nextBtn}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Profile & Emergency Contact */}
      {activeStep === 2 && (
        <form
          onSubmit={handleProfileSubmit}
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-card border border-slate-200/80 space-y-8"
        >
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy flex items-center gap-2.5">
              <User className="w-6 h-6 text-brand-teal" />
              <span>{t.onboarding.profile.title}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t.onboarding.profile.subtitle}
            </p>
          </div>

          {/* Personal Info */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-brand-navy border-l-4 border-brand-teal pl-3">
              {t.onboarding.profile.personalSection}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.fullName} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น สมชาย ใจดี"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.nickname}
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="เช่น ชาย, ปาล์ม"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.phone} *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxx"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.gender}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                >
                  <option value="MALE">{t.onboarding.profile.genderOptions.male}</option>
                  <option value="FEMALE">{t.onboarding.profile.genderOptions.female}</option>
                  <option value="OTHER">{t.onboarding.profile.genderOptions.other}</option>
                  <option value="PREFER_NOT_TO_SAY">
                    {t.onboarding.profile.genderOptions.preferNotToSay}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.birthDate}
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t.onboarding.profile.bio}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t.onboarding.profile.bioPlaceholder}
                className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-base font-bold text-brand-navy border-l-4 border-rose-500 pl-3">
                {t.onboarding.profile.emergencySection}
              </h3>
              <p className="text-xs text-rose-600 mt-1 font-medium">
                {t.onboarding.profile.emergencyNotice}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.emergencyName} *
                </label>
                <input
                  type="text"
                  required
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="เช่น สมศรี ใจดี"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.relationship} *
                </label>
                <select
                  value={emergencyRelationship}
                  onChange={(e) => setEmergencyRelationship(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                >
                  <option value="PARENT">{t.onboarding.profile.relationshipOptions.parent}</option>
                  <option value="SPOUSE">{t.onboarding.profile.relationshipOptions.spouse}</option>
                  <option value="SIBLING">{t.onboarding.profile.relationshipOptions.sibling}</option>
                  <option value="RELATIVE">{t.onboarding.profile.relationshipOptions.relative}</option>
                  <option value="FRIEND">{t.onboarding.profile.relationshipOptions.friend}</option>
                  <option value="OTHER">{t.onboarding.profile.relationshipOptions.other}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.emergencyPhone} *
                </label>
                <input
                  type="tel"
                  required
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="08xxxxxxxx"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {t.onboarding.profile.emergencyAltPhone}
                </label>
                <input
                  type="tel"
                  value={emergencyAltPhone}
                  onChange={(e) => setEmergencyAltPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์บ้านหรือที่ทำงาน"
                  className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="py-3 px-6 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.common.back}</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3.5 px-8 rounded-xl font-semibold text-white bg-brand-navy hover:bg-brand-navy-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <span>{t.onboarding.profile.saveBtn}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: ID Verification */}
      {activeStep === 3 && (
        <form
          onSubmit={handleIdVerifySubmit}
          className="bg-white rounded-3xl p-6 sm:p-10 shadow-card border border-slate-200/80 space-y-8"
        >
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy flex items-center gap-2.5">
              <Upload className="w-6 h-6 text-brand-teal" />
              <span>{t.onboarding.idVerify.title}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t.onboarding.idVerify.subtitle}
            </p>
          </div>

          {/* Security Banner */}
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm text-brand-teal-900 leading-relaxed">
              {t.onboarding.idVerify.securityBanner}
            </span>
          </div>

          {/* ID Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.onboarding.idVerify.idNumber} *
            </label>
            <input
              type="text"
              required
              maxLength={17}
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
              placeholder="1-xxxx-xxxxx-xx-x"
              className="w-full px-4 py-3 text-base font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/40 focus:border-brand-teal"
            />
          </div>

          {/* Upload Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. ID Card Front */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-teal/60 transition-colors bg-slate-50/50 flex flex-col items-center text-center">
              <h4 className="font-semibold text-brand-navy mb-1">
                {t.onboarding.idVerify.cardUploadTitle}
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                {t.onboarding.idVerify.cardUploadDesc}
              </p>

              {idCardPreview ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 mb-3 bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={idCardPreview}
                    alt="ID Card Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIdCardFile(null);
                      setIdCardPreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-44 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors mb-3">
                  <Camera className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-brand-teal">
                    {t.onboarding.idVerify.uploadPlaceholder}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {t.onboarding.idVerify.supportedFormats}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "card")}
                  />
                </label>
              )}
            </div>

            {/* 2. Selfie Holding ID */}
            <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-teal/60 transition-colors bg-slate-50/50 flex flex-col items-center text-center">
              <h4 className="font-semibold text-brand-navy mb-1">
                {t.onboarding.idVerify.selfieUploadTitle}
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                {t.onboarding.idVerify.selfieUploadDesc}
              </p>

              {selfiePreview ? (
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200 mb-3 bg-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selfiePreview}
                    alt="Selfie Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelfieFile(null);
                      setSelfiePreview(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-44 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors mb-3">
                  <User className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-brand-teal">
                    {t.onboarding.idVerify.uploadPlaceholder}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">
                    {t.onboarding.idVerify.supportedFormats}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, "selfie")}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className="py-3 px-6 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.common.back}</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3.5 px-8 rounded-xl font-semibold text-white bg-brand-navy hover:bg-brand-navy-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <span>{t.onboarding.idVerify.submitBtn}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 4: Mental Health Assessment */}
      {activeStep === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-card border border-slate-200/80 space-y-8">
          <div className="border-b border-slate-100 pb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-navy flex items-center gap-2.5">
              <HeartHandshake className="w-6 h-6 text-brand-teal" />
              <span>{t.onboarding.assessment.title}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {t.onboarding.assessment.subtitle}
            </p>
          </div>

          {/* Important Medical Disclaimer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{t.onboarding.assessment.disclaimerTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-normal">
              {t.onboarding.assessment.disclaimerText}
            </p>
          </div>

          {/* Cooldown Active Banner */}
          {cooldownData?.cooldownActive ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-navy mb-1">
                  {t.onboarding.assessment.cooldownActive}
                </h3>
                <p className="text-2xl font-bold font-mono text-brand-teal">
                  {cooldownData.remainingHours} ชั่วโมง (Hours)
                </p>
                {cooldownData.nextEligibleDate && (
                  <p className="text-xs text-slate-500 mt-1">
                    {t.onboarding.assessment.results.nextEligible}{" "}
                    {new Date(cooldownData.nextEligibleDate).toLocaleString(
                      locale === "th" ? "th-TH" : "en-US"
                    )}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveStep(5)}
                className="py-3 px-6 rounded-xl font-semibold text-white bg-brand-navy hover:bg-brand-navy-800 transition-all"
              >
                {t.onboarding.assessment.results.goToDashboard}
              </button>
            </div>
          ) : (
            <>
              {/* Question Instructions */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 text-brand-teal-900 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-teal" />
                <span>{t.onboarding.assessment.instruction}</span>
              </div>

              {/* 9 Questions */}
              <div className="space-y-6">
                {SCREENING_QUESTIONS.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200 hover:border-slate-300 transition-colors space-y-3"
                  >
                    <p className="font-semibold text-sm sm:text-base text-brand-navy">
                      {locale === "th" ? q.th : q.en}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { val: 0, label: t.onboarding.assessment.scale0 },
                        { val: 1, label: t.onboarding.assessment.scale1 },
                        { val: 2, label: t.onboarding.assessment.scale2 },
                        { val: 3, label: t.onboarding.assessment.scale3 },
                      ].map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => handleScoreSelect(idx, opt.val)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            answers[idx] === opt.val
                              ? "bg-brand-teal text-white border-brand-teal shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 text-xs text-slate-500 text-center">
                🛡️ {t.onboarding.assessment.privacyGuarantee}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="py-3 px-6 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.common.back}</span>
                </button>
                <button
                  type="button"
                  onClick={handleScreeningSubmit}
                  disabled={isSubmitting || answers.some((a) => a === -1)}
                  className="py-3.5 px-8 rounded-xl font-semibold text-white bg-brand-teal hover:bg-brand-teal-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{t.onboarding.assessment.scoreCalculating}</span>
                  ) : (
                    <>
                      <span>{t.onboarding.assessment.submitBtn}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 5: Completed Summary Overview */}
      {activeStep === 5 && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-card border border-slate-200/80 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-navy">
              {t.onboarding.completedSummary.title}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
              {t.onboarding.completedSummary.desc}
            </p>
          </div>

          {/* Badges Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto py-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
              <span className="text-xs text-slate-500 mb-2 font-medium">
                {t.onboarding.completedSummary.idStatusLabel}
              </span>
              <VerifiedBadge
                isVerified={user?.isVerified}
                status={user?.idCardStatus}
                size="md"
                showDesc
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center">
              <span className="text-xs text-slate-500 mb-2 font-medium">
                {t.onboarding.completedSummary.screeningStatusLabel}
              </span>
              <ScreeningBadge
                status={user?.screeningStatus || screeningResult?.status || "NOT_STARTED"}
                size="md"
                showDesc
              />
              {screeningResult && (
                <span className="text-[11px] text-slate-500 mt-1 font-mono">
                  คะแนนที่ประเมินได้: {screeningResult.totalScore}/27 ({screeningResult.riskLevel})
                </span>
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs sm:text-sm text-brand-teal-900 max-w-lg mx-auto leading-relaxed">
            {t.onboarding.completedSummary.readyMsg}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-semibold text-white bg-brand-navy hover:bg-brand-navy-800 transition-all shadow-md"
            >
              {t.onboarding.completedSummary.exploreBtn}
            </button>
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              แก้ไขข้อมูลการยืนยันตัวตน
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
