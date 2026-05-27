import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { freelancers as fallbackFreelancers } from "../data/freelancers";
import { fetchFreelancers } from "../services/freelancersApi";
import type { Freelancer } from "../types/freelancer";

type FreelancersContextType = {
  freelancers: Freelancer[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getById: (id: string) => Freelancer | undefined;
};

const FreelancersContext = createContext<FreelancersContextType | null>(null);

export const FreelancersProvider = ({ children }: { children: React.ReactNode }) => {
  const [freelancers, setFreelancers] = useState<Freelancer[]>(fallbackFreelancers);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const items = await fetchFreelancers();
      if (items.length > 0) {
        setFreelancers(items);
      }
    } catch {
      // Keep static fallback when backend is not reachable.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getById = useCallback(
    (id: string) => freelancers.find((item) => item.id === id),
    [freelancers]
  );

  const value = useMemo(
    () => ({ freelancers, isLoading, refresh, getById }),
    [freelancers, isLoading, refresh, getById]
  );

  return <FreelancersContext.Provider value={value}>{children}</FreelancersContext.Provider>;
};

export const useFreelancers = () => {
  const context = useContext(FreelancersContext);
  if (!context) throw new Error("useFreelancers must be used within FreelancersProvider");
  return context;
};

