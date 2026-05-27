import { apiRequest } from "./apiClient";
import { mapApiFreelancerToUi } from "./freelancersAdapter";
import type { Freelancer } from "../types/freelancer";

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
  }>;
};

export async function fetchFreelancers() {
  const response = await apiRequest<ListResponse>("/freelancers");
  return response.items.map(mapApiFreelancerToUi);
}

export async function fetchFreelancerById(id: string): Promise<Freelancer> {
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
  }>(`/freelancers/${id}`);
  return mapApiFreelancerToUi(response);
}

