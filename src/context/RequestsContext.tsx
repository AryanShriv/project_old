import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { apiRequest } from "../services/apiClient";
import { NewRequest, Request, SessionType } from "../types/requests";
import { useAuth } from "./AuthContext";

type RequestsContextType = {
  requests: Request[];
  addRequest: (request: NewRequest) => Promise<void>;
  updateRequestStatus: (id: string, status: Request["status"]) => Promise<void>;
  refreshRequests: () => Promise<void>;
};

const RequestsContext = createContext<RequestsContextType | null>(null);
const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

const toSessionType = (engagementType?: string): SessionType =>
  engagementType === "onsite" || engagementType === "ongoing" ? engagementType : "remote";

export const RequestsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);

  const refreshRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      return;
    }
    const role = user.role;
    if (role !== "user" && role !== "expert") {
      setRequests([]);
      return;
    }
    try {
      const data = await apiRequest<{ items: Array<any> }>(`/requests?role=${role}`, {
        auth: true,
      });
      const mapped: Request[] = data.items.map((item) => ({
        id: item._id,
        // userId is populated with the requester's profile on list responses
        userId: item.userId?._id ?? item.userId,
        expertId: item.expertId,
        // Fall back to legacy fields for requests created before the backfill ran
        headline: item.headline || item.projectTitle || "",
        description: item.description || item.userMessage || "",
        sessionType: item.sessionType || toSessionType(item.engagementType),
        aiSummary: item.aiSummary,
        timingPreference: item.timingPreference,
        status: item.status,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        respondedAt: item.respondedAt,
        completedAt: item.completedAt,
        reviewedAt: item.reviewedAt,
        userName: item.userName,
      }));
      setRequests(mapped);
    } catch {
      setRequests([]);
    }
  }, [user]);

  useEffect(() => {
    refreshRequests();
  }, [refreshRequests]);

  const addRequest = useCallback(
    async (request: NewRequest) => {
      if (!MONGO_ID_REGEX.test(request.expertId)) {
        throw new Error(
          "This profile is demo-only and cannot receive requests. Add expert profiles in backend first."
        );
      }
      await apiRequest("/requests", {
        method: "POST",
        auth: true,
        body: request,
      });
      await refreshRequests();
    },
    [refreshRequests]
  );

  const updateRequestStatus = useCallback(
    async (id: string, status: Request["status"]) => {
      await apiRequest(`/requests/${id}/status`, {
        method: "PATCH",
        auth: true,
        body: { status },
      });
      await refreshRequests();
    },
    [refreshRequests]
  );

  return (
    <RequestsContext.Provider
      value={{ requests, addRequest, updateRequestStatus, refreshRequests }}
    >
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = () => {
  const context = useContext(RequestsContext);
  if (!context) throw new Error("useRequests must be used within provider");
  return context;
};
