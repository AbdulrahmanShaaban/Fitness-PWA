"use client";

import { Cloud, CloudOff, RefreshCw, TriangleAlert } from "lucide-react";
import { useSync } from "@/lib/sync/SyncProvider";
import { cn } from "@/lib/utils";
import { Spinner } from "./ui";

export function SyncStatus({ compact = false }: { compact?: boolean }) {
  const { status, lastSyncAt, lastError, isOnline, syncNow } = useSync();

  if (status === "syncing") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Spinner className="h-3.5 w-3.5" />
        {!compact && "Syncing..."}
      </span>
    );
  }

  if (status === "error") {
    return (
      <button
        onClick={() => void syncNow()}
        className="inline-flex items-center gap-1.5 text-xs text-danger"
        title={lastError ?? "Sync failed"}
      >
        <TriangleAlert className="h-3.5 w-3.5" />
        {!compact && "Sync failed — tap to retry"}
      </button>
    );
  }

  if (!isOnline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <CloudOff className="h-3.5 w-3.5" />
        {!compact && "Offline — saved on device"}
      </span>
    );
  }

  if (status === "unconfigured") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Cloud className="h-3.5 w-3.5" />
        {!compact && "Backup not configured"}
      </span>
    );
  }

  if (status === "synced" && lastSyncAt) {
    return (
      <button
        onClick={() => void syncNow()}
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
        title={new Date(lastSyncAt).toLocaleString()}
      >
        <Cloud className="h-3.5 w-3.5 text-accent" />
        {!compact && "Backed up"}
      </button>
    );
  }

  return (
    <button
      onClick={() => void syncNow()}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted hover:text-text"
      )}
    >
      <RefreshCw className="h-3.5 w-3.5" />
      {!compact && "Sync now"}
    </button>
  );
}