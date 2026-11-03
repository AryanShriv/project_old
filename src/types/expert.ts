export type Expert = {
    id: string;
    name: string;
    title: string;
    yearsExperience: string;
    tagline: string;
    rate: string;
    /** Formatted price per session, e.g. "CA$120" or "₹2,500"; empty if not set */
    sessionPrice: string;
    avatar: string;
    skills: string[];

    // New fields for G(Old)
    domain?: string;
    engagementType?: "remote" | "onsite" | "both";
    pricingCAD?: number;
    pricingINR?: number;
    linkedinUrl?: string;
    languages?: string[];
    country?: string;
    city?: string;
    availabilityRadius?: number;
    
    certifications?: {
        type: string;
        number: string;
        body: string;
        verified: boolean;
    }[];
    
    recommendedCount?: number;
    reviewCount?: number;

    approvalStatus?: "pending" | "approved" | "rejected";
    /** True only after admin approval */
    verified: boolean;
    rejectionReason?: string;
    approvedAt?: string;
    adminNotes?: string;

    experience: {
        id: string;
        year: string;
        role: string;
        company: string;
        description: string;
    }[];

    portfolio: {
        id: string;
        title: string;
        description: string;
        image: string;
    }[];
};
