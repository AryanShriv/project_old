export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: "client" | "freelancer" | "admin";
  /** Linked public freelancer profile id (freelancer role only) */
  managedFreelancerId?: string;
};

export type AuthRoleIntent = "client" | "freelancer" | "admin";

export type FreelancerApplicationStatus = "pending" | "approved" | "rejected";
export type FreelancerAccountStatus = "active" | "suspended";

export type FreelancerApplication = {
  id: string;
  email: string;
  password: string;
  name: string;
  managedFreelancerId: string;
  status: FreelancerApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
};

export type AuditAction =
  | "application_approved"
  | "application_rejected"
  | "freelancer_suspended"
  | "freelancer_reactivated";

export type AuditLogEntry = {
  id: string;
  at: string;
  actor: string;
  action: AuditAction;
  target: string;
  details?: string;
};
