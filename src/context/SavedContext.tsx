import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiRequest } from "../services/apiClient";
import { useAuth } from "./AuthContext";

type SavedContextType = {
  savedIds: string[];
  toggleSave: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
  refreshSaved: () => Promise<void>;
};

const SavedContext = createContext<SavedContextType | null>(null);

export const SavedProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const refreshSaved = useCallback(async () => {
    if (!user || user.role !== "client") {
      setSavedIds([]);
      return;
    }
    try {
      const data = await apiRequest<{ items: Array<{ freelancer: { _id: string } }> }>("/saved", {
        auth: true,
      });
      setSavedIds(data.items.map((item) => item.freelancer._id));
    } catch {
      setSavedIds([]);
    }
  }, [user]);

  useEffect(() => {
    refreshSaved();
  }, [refreshSaved]);

  const toggleSave = useCallback(async (id: string) => {
    const isCurrentlySaved = savedIds.includes(id);
    if (isCurrentlySaved) {
      await apiRequest(`/saved/${id}`, { method: "DELETE", auth: true });
    } else {
      await apiRequest(`/saved/${id}`, { method: "POST", auth: true });
    }
    await refreshSaved();
  }, [refreshSaved, savedIds]);

  const isSaved = (id: string) => savedIds.includes(id);

  return (
    <SavedContext.Provider value={{ savedIds, toggleSave, isSaved, refreshSaved }}>
      {children}
    </SavedContext.Provider>
  );
};

export const useSaved = () => {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used within SavedProvider");
  return context;
};
