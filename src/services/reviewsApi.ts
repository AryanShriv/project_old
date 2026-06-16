import { apiRequest } from "./apiClient";

export type Review = {
  _id: string;
  expertId: string;
  userId: {
    _id: string;
    profile: {
      fullName: string;
      avatarUrl?: string;
    }
  };
  requestId: string;
  comment: string;
  whatILearned: string;
  expertStyle: string;
  wouldRecommend: boolean;
  sessionType: string;
  createdAt: string;
  updatedAt: string;
};

export type SubmitReviewPayload = {
  requestId: string;
  comment: string;
  whatILearned?: string;
  expertStyle?: string;
  wouldRecommend: boolean;
  sessionType?: string;
};

export const reviewsApi = {
  getExpertReviews: async (expertId: string): Promise<Review[]> => {
    const data = await apiRequest<{ items: Review[] }>(`/reviews/${expertId}`, {
      method: "GET",
      auth: false,
    });
    return data.items || [];
  },

  submitReview: async (expertId: string, payload: SubmitReviewPayload): Promise<Review> => {
    const data = await apiRequest<Review>(`/reviews/${expertId}`, {
      method: "POST",
      body: payload,
      auth: true,
    });
    return data;
  },
};
