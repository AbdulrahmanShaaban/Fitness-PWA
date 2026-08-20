"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cloud, KeyRound } from "lucide-react";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { login } from "@/lib/sync/engine";
import { isSupabaseConfigured } from "@/lib/sync/supabase";
import { useSync } from "@/lib/sync/SyncProvider";
import { errMsg } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, syncNow } = useSync();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isLoggedIn) {
    return (
      <div className="pt-4">
        <PageHeader title="Sign in" backHref="/" />
        <Card className="p-5">
          <p className="text-sm text-muted">You are already signed in.</p>
          <div className="mt-3">
            <Button onClick={() => router.push("/")}>Back to Coach Log</Button>
          </div>
        </Card>
      </div>
    );
  }

  const submit = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      await syncNow();
      router.push("/");
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <div className="pt-4">
      <PageHeader title="Sign in" subtitle="Backup and sync to the cloud" backHref="/" />

      {!isSupabaseConfigured ? (
        <Card className="p-5">
          <p className="font-medium text-text">Backup is not configured yet</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Coach Log works fully offline without an account. To enable cloud
            backup, set{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-accent">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs text-accent">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            in the app configuration and rebuild.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <Card className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Cloud className="h-5 w-5" />
            </div>
            <p className="text-[13px] leading-snug text-muted">
              Signing in pulls your backup onto this device. The app keeps
              working offline either way.
            </p>
          </Card>

          <Field label="Email">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="trainer@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submit();
              }}
            />
          </Field>

          {error && (
            <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <Button onClick={() => void submit()} loading={busy} size="lg">
            <KeyRound className="h-4 w-4" /> Sign in
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/" className="hover:text-text">
          Skip for now — work offline
        </Link>
      </p>
    </div>
  );
}