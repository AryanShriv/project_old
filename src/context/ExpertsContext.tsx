import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { experts as fallbackExperts } from "../data/experts";
import { fetchExperts } from "../services/expertsApi";
import type { Expert } from "../types/expert";

type ExpertsContextType = {
  experts: Expert[];
  isLoading: boolean;
  /** Message to show when the last load failed and there is nothing to display */
  error: string | null;
  refresh: () => Promise<void>;
  getById: (id: string) => Expert | undefined;
};

const ExpertsContext = createContext<ExpertsContextType | null>(null);

const RETRY_DELAY_MS = 3000;

export const ExpertsProvider = ({ children }: { children: React.ReactNode }) => {
  const [experts, setExperts] = useState<Expert[]>(fallbackExperts);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const items = await fetchExperts();
      setExperts(items);
      setError(null);
    } catch (err) {
      // Keep whatever is already on screen; only surface the error
      setError((err as Error).message || "We couldn't load experts right now.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    // One automatic retry covers a server that is still waking up
    fetchExperts()
      .catch(() => new Promise<Expert[]>((resolve) => setTimeout(resolve, RETRY_DELAY_MS)).then(() => fetchExperts()))
      .then((items) => {
        if (cancelled) return;
        setExperts(items);
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "We couldn't load experts right now.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const getById = useCallback(
    (id: string) => experts.find((item) => item.id === id),
    [experts]
  );

  const value = useMemo(
    () => ({ experts, isLoading, error, refresh, getById }),
    [experts, isLoading, error, refresh, getById]
  );

  return <ExpertsContext.Provider value={value}>{children}</ExpertsContext.Provider>;
};

export const useExperts = () => {
  const context = useContext(ExpertsContext);
  if (!context) throw new Error("useExperts must be used within ExpertsProvider");
  return context;
};
