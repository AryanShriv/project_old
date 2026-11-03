export type Request = {
    id: string;
    userId?: string;
    expertId: string;
    userMessage?: string;
    description?: string;
    aiSummary?: string;
    engagementType?: "remote" | "onsite" | "both" | "ongoing";
    timingPreference?: "asap" | "week" | "month" | "flexible";
    status: "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "expired";
    expiresAt?: string;
    createdAt?: string;
    updatedAt?: string;
    respondedAt?: string;
    /** Shown on expert inbox (demo) */
    userName?: string;
    projectTitle?: string; // Legacy fallback
};