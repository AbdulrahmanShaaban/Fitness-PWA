"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { seedDefaultExercisesIfEmpty } from "@/lib/db/seed";
import {
  getCurrentUserId,
  getSessionEmail,
  syncNow,
} from "@/lib/sync/engine";
import { isSupabaseConfigured } from "@/lib/sync/supabase";
import { onSyncRequested } from "@/lib/sync/trigger";

export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "error"
  | "offline"
  | "unconfigured";

interface SyncContextValue {
  status: SyncStatus;
  lastSyncAt: string | null;
  lastError: string | null;
  isOnline: boolean;
  isLoggedIn: boolean;
  email: string | null;
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  status: "idle",
  lastSyncAt: null,
  lastError: null,
  isOnline: true,
  isLoggedIn: false,
  email: null,
  syncNow: async () => {},
});

export function useSync(): SyncContextValue {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  const runSync = useCallback(async () => {
    if (runningRef.current) return;
    if (!isSupabaseConfigured) {
      setStatus("unconfigured");
      return;
    }
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }
    runningRef.current = true;
    setStatus("syncing");
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        setIsLoggedIn(false);
        setEmail(null);
        setStatus("idle");
        return;
      }
      setIsLoggedIn(true);
      await syncNow(userId);
      setLastSyncAt(new Date().toISOString());
      setLastError(null);
      setStatus("synced");
      await queryClient.invalidateQueries();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("sync failed", e);
      setLastError(message);
      setStatus("error");
    } finally {
      runningRef.current = false;
    }
  }, [queryClient]);

  const debouncedSync = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      void runSync();
    }, 2500);
  }, [runSync]);

  useEffect(() => {
    void seedDefaultExercisesIfEmpty().then(() => queryClient.invalidateQueries({ queryKey: ["exercises"] }));

    const checkSession = async () => {
      const userEmail = await getSessionEmail();
      setEmail(userEmail);
      setIsLoggedIn(Boolean(userEmail));
      if (userEmail) void runSync();
    };
    void checkSession();

    const offUnsub = onSyncRequested(debouncedSync);

    const handleOnline = () => {
      setIsOnline(true);
      debouncedSync();
    };
    const handleOffline = () => setIsOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") debouncedSync();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibility);

    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {});
    }

    return () => {
      offUnsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [debouncedSync, queryClient, runSync]);

  const manualSync = useCallback(async () => {
    await runSync();
  }, [runSync]);

  return (
    <SyncContext.Provider
      value={{
        status,
        lastSyncAt,
        lastError,
        isOnline,
        isLoggedIn,
        email,
        syncNow: manualSync,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}