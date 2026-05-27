export type Request = {
    id: string;
    freelancerId: string;
    projectTitle: string;
    status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
    /** Shown on freelancer inbox (demo) */
    clientName?: string;
};