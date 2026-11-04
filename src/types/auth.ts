export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "user" | "expert" | "admin";
  accountStatus?: "active" | "pending_review" | "suspended";
  /** Linked public expert profile id (expert role only) */
  managedExpertId?: string;
  /** Admin review outcome of the expert application (expert role only) */
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  /** How many times a rejected application was resubmitted; only one is allowed */
  resubmissionCount?: number;
  /** Has this person entered the code we emailed them? */
  emailVerified?: boolean;
  /** Does the server enforce verification (only once it can deliver email)? */
  emailVerificationRequired?: boolean;
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

export type VerificationChecklist = {
  idVerified: boolean;
  certificateVerified: boolean;
  insuranceConfirmed: boolean;
  linkedinVerified: boolean;
};

export type ExpertApplication = {
  id: string;
  email: string;
  password: string;
  name: string;
  managedExpertId: string;
  status: ExpertApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
  isResubmission?: boolean;
  /** What the expert told us at signup, for the admin checklist */
  details?: {
    country?: string;
    city?: string;
    domain?: string;
    headline?: string;
    yearsExperience?: number;
    engagementTypes?: string[];
    linkedinUrl?: string;
    insuranceDeclared?: boolean;
    certifications?: { type: string; number: string; issuingBody: string }[];
  };
  /** Checklist items the backend requires before approval */
  requirements?: VerificationChecklist;
};

/** Registration payload. Each acknowledgement is stored with a timestamp (PRD 4.5). */
export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  role: AuthRoleIntent;
  acceptedTerms: boolean;
  acknowledgedPlatformOnly?: boolean;
  acknowledgedOnsiteSafety?: boolean;
  acceptedExpertCompliance?: boolean;
  acknowledgedIndependentContractor?: boolean;
  acknowledgedInsurance?: boolean;
  expertProfile?: {
    country: "Canada" | "India";
    city: string;
    domain: string;
    engagementTypes: ("remote" | "onsite")[];
    linkedinUrl: string;
    insuranceDeclared: boolean;
    certification?: { type: string; number: string; issuingBody: string };
  };
};

/** An approved expert as the admin sees them, including suspended ones (GET /admin/experts) */
export type AdminExpert = {
  id: string;
  name: string;
  headline: string;
  domain: string;
  city: string;
  status: "active" | "suspended";
  founderBadge: boolean;
  reviewCount: number;
};

export type AuditAction =
  | "application_submitted"
  | "application_approved"
  | "application_rejected"
  | "expert_suspended"
  | "expert_reactivated"
  | "review_hidden"
  | "review_unhidden"
  | "founder_badge_added"
  | "founder_badge_removed"
  | "other";

export type AuditLogEntry = {
  id: string;
  at: string;
  actor: string;
  action: AuditAction;
  target: string;
  details?: string;
};
