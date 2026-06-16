export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "expert" | "admin";
  /** Linked public expert profile id (expert role only) */
  managedExpertId?: string;
  /** Extended profile fields */
  profile?: {
    fullName?: string;
    bio?: string;
    headline?: string;
    avatarUrl?: string;
    company?: string;
    website?: string;
    location?: string;
    phone?: string;
    
    // Expert-specific
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

    // Approval tracking
    approvalStatus?: "pending" | "approved" | "rejected";
    rejectionReason?: string;
    approvedAt?: string;
    adminNotes?: string;
  };
};

export type AuthRoleIntent = "user" | "expert" | "admin";

export type ExpertApplicationStatus = "pending" | "approved" | "rejected";
export type ExpertAccountStatus = "active" | "suspended";

export type ExpertApplication = {
  id: string;
  email: string;
  password: string;
  name: string;
  managedExpertId: string;
  status: ExpertApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type AuditAction =
  | "application_approved"
  | "application_rejected"
  | "expert_suspended"
  | "expert_reactivated";

export type AuditLogEntry = {
  id: string;
  at: string;
  actor: string;
  action: AuditAction;
  target: string;
  details?: string;
};
