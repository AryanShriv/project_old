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
  portfolio?: Array<{ title?: string; description?: string; link?: string }>;
};

export const mapApiFreelancerToUi = (item: ApiFreelancer): Freelancer => ({
  id: item._id,
  name: item.fullName,
  title: item.headline || "Freelancer",
  yearsExperience: String(item.yearsExperience ?? 0),
  tagline: item.bio || "Experienced freelance professional.",
  rate: `$${item.hourlyRate ?? 0}`,
  avatar: item.avatarUrl || "https://i.pravatar.cc/200",
  skills: item.skills ?? [],
  experience: [],
  portfolio: (item.portfolio ?? []).map((p, index) => ({
    id: `portfolio-${index}`,
    title: p.title || "Project",
    description: p.description || "",
    image: p.link || "https://picsum.photos/400/300",
  })),
});

