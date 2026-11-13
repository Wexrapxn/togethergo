"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserRoleData {
  id: string;
  role: string;
}

export interface ProfileData {
  id: string;
  fullName: string;
  nickname?: string | null;
  phone?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  idCardNumber?: string | null;
}

export interface EmergencyContactData {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  altPhone?: string | null;
}

export interface ScreeningAttemptData {
  id: string;
  totalScore: number;
  riskLevel: string;
  status: string;
  nextEligibleDate: string;
  attemptDate: string;
}

export interface VerificationDocumentData {
  id: string;
  documentType: string;
  fileUrl: string;
  status: string;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  idCardStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  screeningStatus: "NOT_STARTED" | "PENDING_REVIEW" | "PASSED" | "FAILED";
  onboardingStep: number;
  roles: UserRoleData[];
  profile?: ProfileData | null;
  emergencyContacts?: EmergencyContactData[];
  screeningAttempts?: ScreeningAttemptData[];
  verificationDocuments?: VerificationDocumentData[];
}

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (usernameOrEmail: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }
      setUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }
      setUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Network error" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some((r) => r.role.toUpperCase() === role.toUpperCase());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
