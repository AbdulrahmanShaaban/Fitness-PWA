"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { InstallPrompt } from "@/components/InstallPrompt";
import { SyncStatus } from "@/components/SyncStatus";
import { Badge, Button, Card, EmptyState, ErrorState, Input, Spinner } from "@/components/ui";
import { useClients, useClient, useClientSessions } from "@/lib/hooks";
import { clientInitials, formatPhone } from "@/lib/repos/clients";
import { fmtDate } from "@/lib/utils";

export default function HomePage() {
  const { data: clients, isLoading, isError, refetch } = useClients();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
    );
  }, [clients, query]);

  return (
    <div className="pt-4">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-text">
            Coach Log
          </h1>
          <p className="mt-0.5 text-sm text-muted">Training records, on device</p>
        </div>
        <SyncStatus />
      </header>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-10"
            placeholder="Search clients..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Link href="/clients/new">
          <Button className="h-11 px-4">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </Link>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState message="Could not load clients." onRetry={() => void refetch()} />
      )}

      {!isLoading && !isError && filtered.length === 0 && clients && clients.length > 0 && (
        <EmptyState
          icon={<Search className="h-5 w-5" />}
          title="No clients match your search"
          hint="Try a different name or phone number."
        />
      )}

      {!isLoading && !isError && (!clients || clients.length === 0) && (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No clients yet"
          hint="Add your first client to start logging sessions."
          action={
            <Link href="/clients/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> Add client
              </Button>
            </Link>
          }
        />
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map((client) => (
          <ClientRow key={client.id} clientId={client.id} />
        ))}
      </div>

      <InstallPrompt />
    </div>
  );
}

function ClientRow({ clientId }: { clientId: string }) {
  const { data: client } = useClient(clientId);
  const { data: sessions } = useClientSessions(clientId);
  if (!client) return null;
  const lastSession = sessions?.[0]?.date;

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="flex items-center gap-3 p-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-display font-bold text-accent">
          {clientInitials(client.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{client.fullName}</p>
          <p className="truncate text-[13px] text-muted">
            {formatPhone(client.phone)} · Started {fmtDate(client.startDate)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge>{sessions?.length ?? 0} sessions</Badge>
          {lastSession && (
            <span className="hidden text-xs text-muted sm:inline">
              Last {fmtDate(lastSession)}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-muted" />
        </div>
      </Card>
    </Link>
  );
}