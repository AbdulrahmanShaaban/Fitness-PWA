"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "coach-log-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallPrompt() {
  const [ios, setIos] = useState(() => {
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
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      localStorage.setItem(STORAGE_KEY, "1");
      setIos(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIos(false);
    setDeferredPrompt(null);
  };

  const install = async () => {
    const prompt = deferredPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(STORAGE_KEY, "1");
      setDeferredPrompt(null);
    }
  };

  const shown = ios || deferredPrompt !== null;
  if (!shown) return null;

  return (
    <div className="fixed inset-x-0 bottom-24 z-40 mx-auto w-full max-w-lg px-4">
      <div
        className={cn(
          "flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xl"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          {deferredPrompt ? (
            <Download className="h-4.5 w-4.5" />
          ) : (
            <Share className="h-4.5 w-4.5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">Install Coach Log</p>
          {deferredPrompt ? (
            <p className="mt-0.5 text-[13px] leading-snug text-muted">
              Add it to your home screen with full offline access.
            </p>
          ) : (
            <p className="mt-0.5 text-[13px] leading-snug text-muted">
              Tap Share, then &quot;Add to Home Screen&quot; to use it like an
              app with full offline access.
            </p>
          )}
        </div>
        {deferredPrompt ? (
          <button
            onClick={() => void install()}
            className="shrink-0 rounded-xl bg-accent px-3.5 py-2 text-sm font-semibold text-[#0a0a0b] active:scale-[0.98]"
          >
            Install
          </button>
        ) : (
          <button
            onClick={dismiss}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted hover:text-text"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}