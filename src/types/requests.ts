export type SessionType = "remote" | "onsite" | "ongoing";
export type TimingPreference = "asap" | "week" | "month" | "flexible";

/**
 * A session request as the app sees it. RequestsContext normalises the backend's
 * legacy fields (projectTitle, userMessage, engagementType) into headline,
 * description and sessionType, so screens only ever read the new names.
 */
export type Request = {
    id: string;
    userId?: string;
    expertId: string;
    headline: string;
    description: string;
    sessionType: SessionType;
    timingPreference?: TimingPreference;
    aiSummary?: string;
    status: "pending" | "accepted" | "rejected" | "cancelled" | "completed" | "expired";
    expiresAt?: string;
    createdAt?: string;
    updatedAt?: string;
    respondedAt?: string;
    completedAt?: string;
    /** Set once the user has reviewed this session; only one review per session */
    reviewedAt?: string;
    /** Display name of the person who sent the request (shown to experts) */
    userName?: string;
};

/** Payload for POST /requests (PRD 3.5) */
export type NewRequest = {
    expertId: string;
    headline: string;
    description: string;
    sessionType: SessionType;
    timingPreference: TimingPreference;
    /** Disclaimer ids the user ticked (PRD 4.6) and the version of the text they saw */
    acknowledgedDisclaimers: string[];
    disclaimerVersion: string;
};
