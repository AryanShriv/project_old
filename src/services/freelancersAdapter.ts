import type { Freelancer } from "../types/freelancer";

type ApiFreelancer = {
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
};

export const mapApiFreelancerToUi = (item: ApiFreelancer): Freelancer => ({
  id: item._id,
  name: item.fullName,
  title: item.headline || "Freelancer",
  yearsExperience: String(item.yearsExperience ?? 0),
  tagline: item.bio || "Experienced freelance professional.",
  rate: `$${item.hourlyRate ?? 0}`,
  avatar: item.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(item.fullName || "User") + "&background=F4CF87&color=58360B",
  skills: item.skills ?? [],
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

