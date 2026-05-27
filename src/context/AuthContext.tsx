import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { apiRequest, clearTokens, persistTokens } from "../services/apiClient";
import { registerPushToken, unregisterPushToken } from "../services/notificationsService";
import type {
    AuditLogEntry,
    AuthRoleIntent,
    AuthUser,
    FreelancerAccountStatus,
    FreelancerApplication,
} from "../types/auth";

const SESSION_KEY = "@auth_session_v1";

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  applications: FreelancerApplication[];
  auditLogs: AuditLogEntry[];
  freelancerStatus: Record<string, FreelancerAccountStatus>;
  login: (
    email: string,
    password: string,
    intent: AuthRoleIntent,
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  register: (input: {
    email: string;
    password: string;
    name: string;
    role: AuthRoleIntent;
    managedFreelancerId?: string;
    acceptedTerms: boolean;
    acceptedFreelancerCompliance?: boolean;
  }) => Promise<
    | { ok: true; requiresApproval?: boolean; message?: string }
    | { ok: false; message: string }
  >;
  reviewApplication: (
    id: string,
    decision: "approved" | "rejected",
  ) => Promise<void>;
  setFreelancerAccountStatus: (
    freelancerId: string,
    status: FreelancerAccountStatus,
  ) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);
const DEFAULT_FREELANCER_STATUS: Record<string, FreelancerAccountStatus> = {};

type BackendAuthUser = {
  id: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  accountStatus: string;
  managedFreelancerId?: string;
  profile?: { fullName?: string };
};

type BackendApplication = {
  _id: string;
  email?: string;
  name?: string;
  freelancerProfileId?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  review?: { reviewedAt?: string };
};

type BackendAudit = {
  _id: string;
  createdAt: string;
  action: string;
  actorId: string;
  entityId: string;
  metadata?: { decision?: string; status?: string; note?: string; actorEmail?: string };
};

const toAuditAction = (item: BackendAudit): AuditLogEntry["action"] => {
  if (item.action === "application_reviewed") {
    return item.metadata?.decision === "approved" ? "application_approved" : "application_rejected";
  }
  if (item.action === "freelancer_status_updated") {
    return item.metadata?.status === "suspended" ? "freelancer_suspended" : "freelancer_reactivated";
  }
  return "application_rejected";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<FreelancerApplication[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [freelancerStatus, setFreelancerStatus] = useState<
    Record<string, FreelancerAccountStatus>
  >(DEFAULT_FREELANCER_STATUS);

  const loadFreelancerStatuses = useCallback(async () => {
    try {
      const data = await apiRequest<{ items: Array<{ _id: string; profileStatus: string }> }>("/freelancers");
      const next: Record<string, FreelancerAccountStatus> = {};
      data.items.forEach((item) => {
        next[item._id] = item.profileStatus === "suspended" ? "suspended" : "active";
      });
      setFreelancerStatus(next);
    } catch {
      setFreelancerStatus({});
    }
  }, []);

  const loadAdminData = useCallback(async () => {
    try {
      const [apps, audits] = await Promise.all([
        apiRequest<{ items: BackendApplication[] }>("/admin/applications", { auth: true }),
        apiRequest<{ items: BackendAudit[] }>("/admin/audit-logs", { auth: true }),
      ]);
      const mappedApps: FreelancerApplication[] = apps.items.map((item) => ({
        id: item._id,
        email: item.email || "unknown@email.com",
        password: "",
        name: item.name || "Freelancer",
        managedFreelancerId: item.freelancerProfileId || "",
        status: item.status,
        createdAt: item.createdAt,
        reviewedAt: item.review?.reviewedAt,
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
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const rawSession = await AsyncStorage.getItem(SESSION_KEY);
        await loadFreelancerStatuses();
        if (rawSession) {
          const parsed = JSON.parse(rawSession) as AuthUser;
          setUser(parsed);
          if (parsed.role === "admin") {
            await loadAdminData();
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadAdminData, loadFreelancerStatuses]);

  const persistSession = useCallback(async (next: AuthUser | null) => {
    setUser(next);
    if (next) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const login = useCallback(
    async (email: string, password: string, intent: AuthRoleIntent) => {
      try {
        const data = await apiRequest<{
          accessToken: string;
          refreshToken: string;
          user: BackendAuthUser;
        }>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        if (data.user.role !== intent) {
          return { ok: false as const, message: "Account type does not match selected role." };
        }
        if (data.user.accountStatus === "suspended") {
          return { ok: false as const, message: "Your account is suspended by admin." };
        }
        await persistTokens(data.accessToken, data.refreshToken);
        const nextUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.profile?.fullName || data.user.email.split("@")[0],
          managedFreelancerId: data.user.managedFreelancerId,
        };
        await persistSession(nextUser);
        if (nextUser.role === "admin") {
          await loadAdminData();
        }
        // Register device token for push notifications (non-blocking).
        registerPushToken();
        return { ok: true as const };
      } catch (error) {
        return { ok: false as const, message: (error as Error).message || "Login failed" };
      }
    },
    [loadAdminData, persistSession],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      name: string;
      role: AuthRoleIntent;
      managedFreelancerId?: string;
      acceptedTerms: boolean;
      acceptedFreelancerCompliance?: boolean;
    }) => {
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
      if (input.role === "freelancer" && !input.acceptedFreelancerCompliance) {
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
            acceptedTerms: input.acceptedTerms,
            acceptedFreelancerCompliance: input.acceptedFreelancerCompliance ?? false,
          },
        });
        if (input.role === "freelancer") {
          await clearTokens();
          return {
            ok: true as const,
            requiresApproval: true,
            message: "Application submitted. Wait for admin approval.",
          };
        }
        await persistTokens(data.accessToken, data.refreshToken);
        await persistSession({
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          name: data.user.profile?.fullName || trimmedName,
          managedFreelancerId: data.user.managedFreelancerId,
        });
        // Register device token for push notifications (non-blocking).
        registerPushToken();
        return { ok: true as const };
      } catch (error) {
        return { ok: false as const, message: (error as Error).message || "Registration failed" };
      }
    },
    [persistSession],
  );

  const reviewApplication = useCallback(
    async (id: string, decision: "approved" | "rejected") => {
      await apiRequest(`/admin/applications/${id}`, {
        method: "PATCH",
        body: { decision },
        auth: true,
      });
      await Promise.all([loadAdminData(), loadFreelancerStatuses()]);
    },
    [loadAdminData, loadFreelancerStatuses],
  );

  const setFreelancerAccountStatus = useCallback(
    async (freelancerId: string, status: FreelancerAccountStatus) => {
      await apiRequest(`/admin/freelancers/${freelancerId}/status`, {
        method: "PATCH",
        body: { status },
        auth: true,
      });
      await Promise.all([loadAdminData(), loadFreelancerStatuses()]);
    },
    [loadAdminData, loadFreelancerStatuses],
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
      freelancerStatus,
      login,
      register,
      reviewApplication,
      setFreelancerAccountStatus,
      logout,
    }),
    [
      user,
      isLoading,
      applications,
      auditLogs,
      freelancerStatus,
      login,
      register,
      reviewApplication,
      setFreelancerAccountStatus,
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
