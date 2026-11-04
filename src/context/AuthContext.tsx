import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { ApiError, apiRequest, clearTokens, persistTokens } from "../services/apiClient";
import { registerPushToken, unregisterPushToken } from "../services/notificationsService";
import { checkRateLimit, clearRateLimit, recordFailedAttempt } from "../services/rateLimiter";
import type {
    AdminExpert,
    AuditLogEntry,
    AuthRoleIntent,
    AuthUser,
    ExpertAccountStatus,
    ExpertApplication,
    RegisterInput,
    VerificationChecklist,
} from "../types/auth";
import { TERMS_VERSION } from "../constants/trust";

const SESSION_KEY = "@auth_session_v1";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  applications: ExpertApplication[];
  auditLogs: AuditLogEntry[];
  expertStatus: Record<string, ExpertAccountStatus>;
  /** Signs in and reports the account's role, so the caller can open the right area */
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; role: AuthRoleIntent } | { ok: false; message: string }>;
  /** Experts are signed in straight away; their dashboard shows that the application is under review */
  register: (
    input: RegisterInput,
  ) => Promise<{ ok: true; needsEmailVerification: boolean } | { ok: false; message: string }>;
  /** Email a new 6-digit verification code to the signed-in person */
  sendVerificationCode: () => Promise<void>;
  /** Check the code; updates the session when it's right, throws with the reason when not */
  verifyEmail: (code: string) => Promise<void>;
  /** Email a password reset code (the answer is the same whether or not the email has an account) */
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<string>;
  /** Delete the signed-in account after confirming the password, then sign out on this device */
  deleteAccount: (password: string) => Promise<void>;
  /** Throws with the backend message (e.g. checklist incomplete) so the admin sees why */
  reviewApplication: (
    id: string,
    decision: "approved" | "rejected",
    options?: { note?: string; checklist?: VerificationChecklist },
  ) => Promise<void>;
  /** Rejected experts can resubmit their edited profile once (PRD 4.4) */
  resubmitApplication: () => Promise<void>;
  setExpertAccountStatus: (
    expertId: string,
    status: ExpertAccountStatus,
  ) => Promise<void>;
  /** Admin only: every approved expert, including suspended ones */
  adminExperts: AdminExpert[];
  /** Admin only: reload applications, audit log and experts */
  refreshAdminData: () => Promise<void>;
  /** PRD 5.4: mark or unmark an approved expert as a Founding Expert */
  setFounderBadge: (expertId: string, founderBadge: boolean) => Promise<void>;
  updateProfile: (fields: Record<string, string>) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const DEFAULT_EXPERT_STATUS: Record<string, ExpertAccountStatus> = {};

type BackendAuthUser = {
  id: string;
  email: string;
  role: "user" | "expert" | "admin";
  accountStatus: "active" | "pending_review" | "suspended";
  managedExpertId?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  resubmissionCount?: number;
  emailVerified?: boolean;
  emailVerificationRequired?: boolean;
  profile?: {
    fullName?: string;
    bio?: string;
    headline?: string;
    avatarUrl?: string;
    company?: string;
    website?: string;
    location?: string;
    phone?: string;

    yearsExperience?: number;
    domain?: string;
    engagementType?: "remote" | "onsite" | "both";
    pricingCAD?: number;
    pricingINR?: number;
    certifications?: Array<{
      type: string;
      number: string;
      body: string;
      verified: boolean;
    }>;
    linkedinUrl?: string;
    languages?: string[];
    availabilityRadius?: number;
    country?: string;
    city?: string;

    approvalStatus?: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    approvedAt?: string;
    adminNotes?: string;
  };
};

type BackendApplication = {
  _id: string;
  email?: string;
  name?: string;
  expertProfileId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  isResubmission?: boolean;
  review?: { reviewedAt?: string };
  expertProfile?: {
    country?: string;
    city?: string;
    domain?: string;
    headline?: string;
    yearsExperience?: number;
    engagementTypes?: string[];
    linkedinUrl?: string;
    insuranceDeclared?: boolean;
    certifications?: { type: string; number: string; issuingBody?: string; body?: string }[];
  } | null;
  requirements?: VerificationChecklist | null;
};

type BackendAdminExpert = {
  _id: string;
  fullName?: string;
  headline?: string;
  domain?: string;
  city?: string;
  profileStatus?: string;
  founderBadge?: boolean;
  reviewCount?: number;
};

type BackendAudit = {
  _id: string;
  createdAt: string;
  action: string;
  actorId: string;
  entityId: string;
  metadata?: { decision?: string; status?: string; note?: string; actorEmail?: string; founderBadge?: boolean };
};

const toSessionUser = (data: BackendAuthUser): AuthUser => ({
  id: data.id,
  email: data.email,
  role: data.role,
  accountStatus: data.accountStatus,
  name: data.profile?.fullName || data.email.split("@")[0],
  managedExpertId: data.managedExpertId,
  approvalStatus: data.approvalStatus,
  rejectionReason: data.rejectionReason,
  resubmissionCount: data.resubmissionCount ?? 0,
  // Older servers don't send these; treat their accounts as verified
  emailVerified: data.emailVerified ?? true,
  emailVerificationRequired: data.emailVerificationRequired ?? false,
  profile: data.profile,
});

const toAuditAction = (item: BackendAudit): AuditLogEntry["action"] => {
  if (item.action === "application_reviewed") {
    return item.metadata?.decision === "approved" ? "application_approved" : "application_rejected";
  }
  if (item.action === "expert_status_updated") {
    return item.metadata?.status === "suspended" ? "expert_suspended" : "expert_reactivated";
  }
  if (item.action === "founder_badge_updated") {
    return item.metadata?.founderBadge ? "founder_badge_added" : "founder_badge_removed";
  }
  if (item.action === "application_submitted" || item.action === "review_hidden" || item.action === "review_unhidden") {
    return item.action;
  }
  // Never guess: an unknown action must not be shown as something it isn't
  return "other";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<ExpertApplication[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [adminExperts, setAdminExperts] = useState<AdminExpert[]>([]);
  const [expertStatus, setExpertStatus] = useState<
    Record<string, ExpertAccountStatus>
  >(DEFAULT_EXPERT_STATUS);

  const loadExpertStatuses = useCallback(async () => {
    try {
      const data = await apiRequest<{ items: Array<{ _id: string; profileStatus: string }> }>("/experts");
      const next: Record<string, ExpertAccountStatus> = {};
      data.items.forEach((item) => {
        next[item._id] = item.profileStatus === "suspended" ? "suspended" : "active";
      });
      // Merge: the public list never includes suspended experts, which the admin list may have added
      setExpertStatus((prev) => ({ ...prev, ...next }));
    } catch {
      // Keep what we have
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const [apps, audits, experts] = await Promise.all([
        apiRequest<{ items: BackendApplication[] }>("/admin/applications", { auth: true }),
        apiRequest<{ items: BackendAudit[] }>("/admin/audit-logs", { auth: true }),
        apiRequest<{ items: BackendAdminExpert[] }>("/admin/experts", { auth: true }),
      ]);
      const mappedExperts: AdminExpert[] = experts.items.map((item) => ({
        id: item._id,
        name: item.fullName || "Expert",
        headline: item.headline || "",
        domain: item.domain || "",
        city: item.city || "",
        status: item.profileStatus === "suspended" ? "suspended" : "active",
        founderBadge: Boolean(item.founderBadge),
        reviewCount: item.reviewCount ?? 0,
      }));
      setAdminExperts(mappedExperts);
      // The public list leaves out suspended experts, so the admin's status map comes from here
      setExpertStatus(Object.fromEntries(mappedExperts.map((expert) => [expert.id, expert.status])));
      const mappedApps: ExpertApplication[] = apps.items.map((item) => ({
        id: item._id,
        email: item.email || "unknown@email.com",
        password: "",
        name: item.name || "Expert",
        managedExpertId: item.expertProfileId || "",
        status: item.status,
        createdAt: item.createdAt,
        reviewedAt: item.review?.reviewedAt,
        isResubmission: item.isResubmission,
        details: item.expertProfile
          ? {
              ...item.expertProfile,
              certifications: (item.expertProfile.certifications ?? []).map((c) => ({
                type: c.type,
                number: c.number,
                issuingBody: c.issuingBody || c.body || "",
              })),
            }
          : undefined,
        requirements: item.requirements ?? undefined,
      }));
      setApplications(mappedApps);
      const mappedAudit: AuditLogEntry[] = audits.items.map((item: BackendAudit) => ({
        id: item._id,
        at: item.createdAt,
        actor: item.metadata?.actorEmail ?? item.actorId,
        action: toAuditAction(item),
        target: item.entityId,
        details: item.metadata?.note || "",
      }));
      setAuditLogs(mappedAudit);
    } catch {
      setApplications([]);
      setAuditLogs([]);
      setAdminExperts([]);
    }
  }, []);

  useEffect(() => {
    // Not needed to show the first screen, so it never holds up startup
    loadExpertStatuses();

    (async () => {
      let cached: AuthUser | null = null;
      try {
        const rawSession = await AsyncStorage.getItem(SESSION_KEY);
        cached = rawSession ? (JSON.parse(rawSession) as AuthUser) : null;
      } catch {
        cached = null;
      }

      // Show the app straight away with the saved session; check it with the server in the background
      setUser(cached);
      setIsLoading(false);
      if (!cached) return;

      try {
        const res = await apiRequest<{ user: BackendAuthUser }>("/auth/me", { auth: true });
        const freshUser = toSessionUser(res.user);
        setUser(freshUser);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(freshUser));
        if (freshUser.role === "admin") {
          await loadAdminData();
        }
      } catch (err) {
        // Only a definite "not authorised" ends the session. A slow or unreachable server must
        // not log people out; they keep their saved session and the next request tries again.
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          await clearTokens();
          await AsyncStorage.removeItem(SESSION_KEY);
          setUser(null);
        } else {
          console.warn("[Auth] Could not validate the session right now:", (err as Error).message);
        }
      }
    })();
  }, [loadAdminData, loadExpertStatuses]);

  const persistSession = useCallback(async (next: AuthUser | null) => {
    setUser(next);
    if (next) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const rateLimitKey = `login:${email.toLowerCase().trim()}`;

      // Check rate limit before attempting login
      const rateLimit = await checkRateLimit(rateLimitKey);
      if (!rateLimit.allowed) {
        return {
          ok: false as const,
          message: rateLimit.message || "Too many failed attempts. Please try again later."
        };
      }

      try {
        const data = await apiRequest<{
          accessToken: string;
          refreshToken: string;
          user: BackendAuthUser;
        }>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        // The account decides where the person goes; there is no role to pick at sign-in
        if (data.user.accountStatus === "suspended") {
          return { ok: false as const, message: "Your account is paused right now. Please contact support and we will help you sort it out." };
        }

        // Clear rate limit on successful login
        await clearRateLimit(rateLimitKey);

        await persistTokens(data.accessToken, data.refreshToken);
        const nextUser = toSessionUser(data.user);
        await persistSession(nextUser);
        if (nextUser.role === "admin") {
          await loadAdminData();
        }
        // Register device token for push notifications (non-blocking).
        registerPushToken();
        return { ok: true as const, role: nextUser.role };
      } catch (error) {
        // Only a wrong email or password counts toward the lockout, not a server that can't be reached
        if (error instanceof ApiError && error.status === 401) {
          await recordFailedAttempt(rateLimitKey);
        }
        return { ok: false as const, message: (error as Error).message || "Login failed" };
      }
    },
    [loadAdminData, persistSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const normalizedEmail = input.email.trim().toLowerCase();
      const trimmedName = input.name.trim();

      if (trimmedName.length < 2) {
        return { ok: false as const, message: "Full name must be at least 2 characters." };
      }
      if (input.password.length < 6) {
        return { ok: false as const, message: "Password must be at least 6 characters." };
      }
      if (!input.acceptedTerms) {
        return {
          ok: false as const,
          message: "You must accept the Terms and Conditions to register.",
        };
      }
      if (input.role === "expert" && !input.acceptedExpertCompliance) {
        return {
          ok: false as const,
          message: "You must confirm the professional credentials declaration.",
        };
      }

      if (input.role === "admin") {
        return { ok: false as const, message: "Admin accounts are invite-only." };
      }
      try {
        const data = await apiRequest<{
          accessToken: string;
          refreshToken: string;
          user: BackendAuthUser;
        }>("/auth/register", {
          method: "POST",
          body: {
            email: normalizedEmail,
            password: input.password,
            fullName: trimmedName,
            role: input.role,
            termsVersion: TERMS_VERSION,
            acceptedTerms: input.acceptedTerms,
            acknowledgedPlatformOnly: input.acknowledgedPlatformOnly,
            acknowledgedOnsiteSafety: input.acknowledgedOnsiteSafety,
            acceptedExpertCompliance: input.acceptedExpertCompliance,
            acknowledgedIndependentContractor: input.acknowledgedIndependentContractor,
            acknowledgedInsurance: input.acknowledgedInsurance,
            expertProfile: input.expertProfile,
          },
        });
        await persistTokens(data.accessToken, data.refreshToken);
        const sessionUser = toSessionUser(data.user);
        await persistSession(sessionUser);
        // Register device token for push notifications (non-blocking).
        registerPushToken();
        return {
          ok: true as const,
          needsEmailVerification: Boolean(sessionUser.emailVerificationRequired && !sessionUser.emailVerified),
        };
      } catch (error) {
        return { ok: false as const, message: (error as Error).message || "Registration failed" };
      }
    },
    [persistSession],
  );

  const reviewApplication = useCallback(
    async (
      id: string,
      decision: "approved" | "rejected",
      options: { note?: string; checklist?: VerificationChecklist } = {},
    ) => {
      await apiRequest(`/admin/applications/${id}`, {
        method: "PATCH",
        body: { decision, note: options.note ?? "", checklist: options.checklist },
        auth: true,
      });
      await loadAdminData();
    },
    [loadAdminData],
  );

  const resubmitApplication = useCallback(async () => {
    await apiRequest("/applications/expert", { method: "POST", auth: true, body: {} });
    const data = await apiRequest<BackendAuthUser>("/users/me", { auth: true });
    await persistSession(toSessionUser(data));
  }, [persistSession]);

  const setFounderBadge = useCallback(
    async (expertId: string, founderBadge: boolean) => {
      await apiRequest(`/admin/experts/${expertId}/founder`, {
        method: "PATCH",
        body: { founderBadge },
        auth: true,
      });
      await loadAdminData();
    },
    [loadAdminData],
  );

  const setExpertAccountStatus = useCallback(
    async (expertId: string, status: ExpertAccountStatus) => {
      await apiRequest(`/admin/experts/${expertId}/status`, {
        method: "PATCH",
        body: { status },
        auth: true,
      });
      await Promise.all([loadAdminData(), loadExpertStatuses()]);
    },
    [loadAdminData, loadExpertStatuses],
  );

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiRequest<BackendAuthUser>("/users/me", { auth: true });
      await persistSession(toSessionUser(data));
    } catch (err) {
      console.warn("[Auth] refreshUser failed:", err);
    }
  }, [persistSession]);

  const updateProfile = useCallback(async (fields: Record<string, string>) => {
    await apiRequest("/users/me", {
      method: "PATCH",
      auth: true,
      body: fields,
    });
    await refreshUser();
  }, [refreshUser]);

  const sendVerificationCode = useCallback(async () => {
    await apiRequest("/auth/verify-email/send", { method: "POST", auth: true });
  }, []);

  const verifyEmail = useCallback(
    async (code: string) => {
      const data = await apiRequest<{ user: BackendAuthUser }>("/auth/verify-email", {
        method: "POST",
        auth: true,
        body: { code },
      });
      await persistSession(toSessionUser(data.user));
    },
    [persistSession],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await apiRequest("/auth/forgot-password", { method: "POST", body: { email: email.trim().toLowerCase() } });
    return "If that email has a G(Old) account, we've sent a 6-digit code to it.";
  }, []);

  const resetPassword = useCallback(async (email: string, code: string, newPassword: string) => {
    await apiRequest("/auth/reset-password", {
      method: "POST",
      body: { email: email.trim().toLowerCase(), code: code.trim(), newPassword },
    });
    return "Your password has been changed. Please sign in with your new password.";
  }, []);

  const deleteAccount = useCallback(
    async (password: string) => {
      // Remove this device's push token first, while the account still exists
      await unregisterPushToken();
      await apiRequest("/users/me", { method: "DELETE", auth: true, body: { password } });
      await clearTokens();
      await persistSession(null);
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    // Remove push token before clearing auth so the DELETE request still has a valid token.
    await unregisterPushToken();
    try {
      await apiRequest("/auth/logout", { method: "POST", auth: true });
    } catch {
      // Ignore logout API errors.
    }
    await clearTokens();
    await persistSession(null);
  }, [persistSession]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      applications,
      auditLogs,
      expertStatus,
      login,
      register,
      sendVerificationCode,
      verifyEmail,
      requestPasswordReset,
      resetPassword,
      deleteAccount,
      reviewApplication,
      resubmitApplication,
      setExpertAccountStatus,
      setFounderBadge,
      adminExperts,
      refreshAdminData: loadAdminData,
      updateProfile,
      refreshUser,
      logout,
    }),
    [
      user,
      isLoading,
      applications,
      auditLogs,
      expertStatus,
      login,
      register,
      sendVerificationCode,
      verifyEmail,
      requestPasswordReset,
      resetPassword,
      deleteAccount,
      reviewApplication,
      resubmitApplication,
      setExpertAccountStatus,
      setFounderBadge,
      adminExperts,
      loadAdminData,
      updateProfile,
      refreshUser,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
