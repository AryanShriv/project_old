import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { experts as fallbackExperts } from "../data/experts";
import { fetchExperts } from "../services/expertsApi";
import type { Expert } from "../types/expert";

type ExpertsContextType = {
  experts: Expert[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  getById: (id: string) => Expert | undefined;
};

const ExpertsContext = createContext<ExpertsContextType | null>(null);

export const ExpertsProvider = ({ children }: { children: React.ReactNode }) => {
  const [experts, setExperts] = useState<Expert[]>(fallbackExperts);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const items = await fetchExperts();
      if (items.length > 0) {
        setExperts(items);
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
    (id: string) => experts.find((item) => item.id === id),
    [experts]
  );

  const value = useMemo(
    () => ({ experts, isLoading, refresh, getById }),
    [experts, isLoading, refresh, getById]
  );

  return <ExpertsContext.Provider value={value}>{children}</ExpertsContext.Provider>;
};

export const useExperts = () => {
  const context = useContext(ExpertsContext);
  if (!context) throw new Error("useExperts must be used within ExpertsProvider");
  return context;
};
