import type { Expert } from "../types/expert";
import { apiRequest } from "./apiClient";
import { mapApiExpertToUi } from "./expertsAdapter";

type ListResponse = {
  items: Array<{
    _id: string;
    fullName: string;
    headline: string;
    yearsExperience?: number;
    bio?: string;
    hourlyRate?: number;
    avatarUrl?: string;
    skills?: string[];
    portfolio?: Array<{ title?: string; description?: string; link?: string }>;
    reviewCount?: number;
    recommendedCount?: number;
  }>;
};

export async function fetchExperts() {
  const response = await apiRequest<ListResponse>("/experts");
  return response.items.map(mapApiExpertToUi);
}

export async function fetchExpertById(id: string): Promise<Expert> {
  const response = await apiRequest<{
    _id: string;
    fullName: string;
    headline: string;
    yearsExperience?: number;
    bio?: string;
    hourlyRate?: number;
    avatarUrl?: string;
    skills?: string[];
    portfolio?: Array<{ title?: string; description?: string; link?: string }>;
    reviewCount?: number;
    recommendedCount?: number;
  }>(`/experts/${id}`, { auth: true }); // lets admins and the owner see non-active profiles
  return mapApiExpertToUi(response);
}
