"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LogOut, RefreshCw, Share, ShieldCheck } from "lucide-react";
import { SyncStatus } from "@/components/SyncStatus";
import { Button, Card, PageHeader } from "@/components/ui";
import { exportAllData } from "@/lib/export";
import { logout } from "@/lib/sync/engine";
import { useSync } from "@/lib/sync/SyncProvider";
import { errMsg, fmtDateTime } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { status, lastSyncAt, lastError, isOnline, isLoggedIn, email, syncNow } =
    useSync();
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setPersisted).catch(() => setPersisted(null));
    }
  }, []);

  const doExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await exportAllData();
      setMessage("Export downloaded.");
    } catch (e) {
      setMessage(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await logout();
      router.push("/");
    } catch (e) {
      setMessage(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <div className="pt-4">
      <PageHeader title="Settings" subtitle="Sync, backup and app details" />

      <div className="flex flex-col gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-text">Trainer account</p>
            <SyncStatus />
          </div>
          {isLoggedIn ? (
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm text-muted">{email}</p>
              <Button variant="danger" size="sm" onClick={() => void doLogout()} loading={busy}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Not signed in.{" "}
              <a href="/login" className="text-accent hover:underline">
                Sign in
              </a>{" "}
              to back up to the cloud.
            </p>
          )}
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-text">Backup &amp; sync</p>
            <Button size="sm" variant="outline" onClick={() => void syncNow()}>
              <RefreshCw className="h-4 w-4" /> Sync now
            </Button>
          </div>
          <dl className="mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Status</dt>
              <dd className="text-text">
                {status === "syncing"
                  ? "Syncing..."
                  : status === "synced"
                    ? "Up to date"
                    : status === "error"
                      ? "Failed"
                      : status === "offline"
                        ? "Offline"
                        : status === "unconfigured"
                          ? "Not configured"
                          : isLoggedIn
                            ? "Waiting"
                            : "Not signed in"}
              </dd>
            </div>
            {lastSyncAt && (
              <div className="flex justify-between">
                <dt className="text-muted">Last sync</dt>
                <dd className="text-text">{fmtDateTime(lastSyncAt)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">Connection</dt>
              <dd className={isOnline ? "text-text" : "text-danger"}>
                {isOnline ? "Online" : "Offline"}
              </dd>
            </div>
          </dl>
          {lastError && (
            <p className="mt-3 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              {lastError}
            </p>
          )}
        </Card>

        <Card className="p-4">
          <p className="flex items-center gap-2 font-medium text-text">
            <ShieldCheck className="h-4 w-4 text-accent" /> Storage protection
          </p>
          <p className="mt-1.5 text-sm text-muted">
            {persisted === null
              ? "Checking browser storage protection..."
              : persisted
                ? "This browser protects Coach Log data from being cleared."
                : "Your browser may clear this data if unused. Regular backups protect you."}
          </p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-text">Manual export</p>
              <p className="mt-0.5 text-sm text-muted">
                Full JSON backup of everything on this device.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void doExport()} loading={busy}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
          {message && (
            <p className="mt-2 text-sm text-muted">{message}</p>
          )}
        </Card>

        <Card className="p-4">
          <p className="flex items-center gap-2 font-medium text-text">
            <Share className="h-4 w-4 text-accent" /> Install on your phone
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            In Safari, tap Share and choose &quot;Add to Home Screen&quot;. The
            app then runs full-screen with its own icon and keeps your data
            even when Safari closes.
          </p>
        </Card>
      </div>
    </div>
  );
}