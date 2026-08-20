"use client";

import { Share, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "coach-log-install-dismissed";

export function InstallPrompt() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream;
    const standalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;
    const dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    return isIos && !standalone && !dismissed;
  });

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 mx-auto w-full max-w-lg px-4">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xl"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Share className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">Install Coach Log</p>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">
            Tap Share, then &quot;Add to Home Screen&quot; to use it like an
            app with full offline access.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-text"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}