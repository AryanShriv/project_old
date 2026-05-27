import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { Request } from "../types/requests";
import { apiRequest } from "../services/apiClient";
import { useAuth } from "./AuthContext";

type RequestsContextType = {
  requests: Request[];
  addRequest: (request: Request) => Promise<void>;
  updateRequestStatus: (id: string, status: Request["status"]) => Promise<void>;
  refreshRequests: () => Promise<void>;
};

const RequestsContext = createContext<RequestsContextType | null>(null);
const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

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
    const role = user.role === "admin" ? "client" : user.role;
    if (role !== "client" && role !== "freelancer") {
      setRequests([]);
      return;
    }
    try {
      const data = await apiRequest<{ items: Array<any> }>(`/requests?role=${role}`, {
        auth: true,
      });
      const mapped: Request[] = data.items.map((item) => ({
        id: item._id,
        freelancerId: item.freelancerId,
        projectTitle: item.projectTitle,
        status: item.status,
        clientName: item.clientName,
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
    async (request: Request) => {
      if (!MONGO_ID_REGEX.test(request.freelancerId)) {
        throw new Error(
          "This profile is demo-only and cannot receive requests. Add freelancer profiles in backend first."
        );
      }
      await apiRequest(
        "/requests",
        {
          method: "POST",
          auth: true,
          body: {
            freelancerId: request.freelancerId,
            projectTitle: request.projectTitle,
            description: "",
            budget: 0,
          },
        }
      );
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
