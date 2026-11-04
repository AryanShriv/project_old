import type { Expert } from "../types/expert";

type ApiExpert = {
  _id: string;
  fullName: string;
  headline: string;
  yearsExperience?: number;
  bio?: string;
  hourlyRate?: number;
  avatarUrl?: string;
  skills?: string[];
  portfolio?: Array<{ _id?: string; title?: string; description?: string; link?: string }>;
  experience?: Array<{ _id?: string; year?: string; role?: string; company?: string; description?: string }>;

  // New G(Old) fields
  domain?: string;
  categories?: string[];
  engagementTypes?: ("remote" | "onsite")[];
  engagementType?: "remote" | "onsite" | "both";
  pricingCAD?: number;
  pricingINR?: number;
  linkedinUrl?: string;
  languages?: string[];
  country?: string;
  city?: string;
  availabilityRadius?: number;
  certifications?: { type: string; number: string; issuingBody?: string; body?: string; verified: boolean }[];
  insuranceDeclared?: boolean;
  founderBadge?: boolean;
  recommendPercentage?: number | null;
  styleBreakdown?: { structured?: number; conversational?: number; hands_on?: number };
  approvalStatus?: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  approvedAt?: string;
  adminNotes?: string;
  reviewCount?: number;
  recommendedCount?: number;
};

/** Price per session in the expert's local currency; empty when the expert has not set one. */
const formatSessionPrice = (item: ApiExpert): string => {
  const country = item.country?.toLowerCase();
  if (country === "india" && item.pricingINR) return `₹${item.pricingINR.toLocaleString("en-IN")}`;
  if (country === "canada" && item.pricingCAD) return `CA$${item.pricingCAD}`;
  if (item.pricingCAD) return `CA$${item.pricingCAD}`;
  if (item.pricingINR) return `₹${item.pricingINR.toLocaleString("en-IN")}`;
  return item.hourlyRate ? `$${item.hourlyRate}` : "";
};

const engagementTypesOf = (item: ApiExpert): ("remote" | "onsite")[] => {
  if (item.engagementTypes?.length) return item.engagementTypes;
  if (item.engagementType === "both") return ["remote", "onsite"];
  return [item.engagementType === "onsite" ? "onsite" : "remote"];
};

export const mapApiExpertToUi = (item: ApiExpert): Expert => ({
  id: item._id,
  name: item.fullName,
  title: item.headline || "Expert",
  yearsExperience: String(item.yearsExperience ?? 0),
  tagline: item.bio || "Experienced expert professional.",
  rate: `$${item.hourlyRate ?? 0}`,
  sessionPrice: formatSessionPrice(item),
  // Empty when there is no photo: <Avatar> renders initials instead of calling an external service
  avatar: item.avatarUrl || "",
  skills: item.skills ?? [],

  // Map new fields
  domain: item.domain,
  categories: item.categories ?? [],
  engagementTypes: engagementTypesOf(item),
  engagementType: item.engagementType,
  pricingCAD: item.pricingCAD,
  pricingINR: item.pricingINR,
  linkedinUrl: item.linkedinUrl,
  languages: item.languages,
  country: item.country,
  city: item.city,
  availabilityRadius: item.availabilityRadius,
  certifications: (item.certifications ?? []).map((c) => ({
    type: c.type,
    number: c.number,
    issuingBody: c.issuingBody || c.body || "",
    verified: c.verified,
  })),
  insuranceDeclared: item.insuranceDeclared,
  founderBadge: item.founderBadge,
  approvalStatus: item.approvalStatus,
  // The Verified badge is only earned through admin approval (PRD 4.4)
  verified: item.approvalStatus === "approved",
  rejectionReason: item.rejectionReason,
  approvedAt: item.approvedAt,
  adminNotes: item.adminNotes,
  reviewCount: item.reviewCount ?? 0,
  recommendedCount: item.recommendedCount ?? 0,
  recommendPercentage: item.recommendPercentage ?? null,
  styleBreakdown: {
    structured: item.styleBreakdown?.structured ?? 0,
    conversational: item.styleBreakdown?.conversational ?? 0,
    hands_on: item.styleBreakdown?.hands_on ?? 0,
  },

  experience: (item.experience ?? []).map((exp, index) => ({
    id: exp._id || `exp-${index}`,
    year: exp.year || "",
    role: exp.role || "",
    company: exp.company || "",
    description: exp.description || "",
  })),
  portfolio: (item.portfolio ?? []).map((p, index) => ({
    id: p._id || `portfolio-${index}`,
    title: p.title || "Project",
    description: p.description || "",
    image: p.link || "https://picsum.photos/400/300",
  })),
});
