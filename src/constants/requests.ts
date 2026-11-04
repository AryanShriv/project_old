import type { ThemeColors } from "../design-system/colors";
import type { Request, SessionType, TimingPreference } from "../types/requests";

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  remote: "Remote",
  onsite: "On-site",
  ongoing: "Ongoing mentorship",
};

export const TIMING_LABELS: Record<TimingPreference, string> = {
  asap: "As soon as possible",
  week: "This week",
  month: "This month",
  flexible: "Flexible",
};

export const STATUS_LABELS: Record<Request["status"], string> = {
  pending: "Awaiting reply",
  accepted: "Accepted",
  rejected: "Declined",
  cancelled: "Cancelled",
  completed: "Session completed",
  expired: "Expired",
};

/** Badge colours for a request status, from theme tokens so both modes work. */
export const statusBadgeColors = (status: Request["status"], colors: ThemeColors) => {
  switch (status) {
    case "accepted":
    case "completed":
      return { bg: colors.successMuted, fg: colors.success };
    case "rejected":
    case "expired":
    case "cancelled":
      return { bg: colors.surface, fg: colors.textMuted };
    default:
      return { bg: colors.primaryMuted, fg: colors.onPrimaryMuted };
  }
};
