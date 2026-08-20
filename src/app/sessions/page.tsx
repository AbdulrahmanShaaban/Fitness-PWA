"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClipboardList, Copy, Dumbbell, Plus, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/overlays";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { useCopySession, useDeleteSession, useSessions } from "@/lib/hooks";
import { errMsg, fmtDate } from "@/lib/utils";

export default function SessionsPage() {
  const router = useRouter();
  const { data: sessions, isLoading, isError, refetch } = useSessions();
  const deleteSession = useDeleteSession();
  const copySession = useCopySession();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCopy = async (sessionId: string) => {
    setError(null);
    try {
      const newId = await copySession.mutateAsync([sessionId, undefined]);
      router.push(`/sessions/${newId}`);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="pt-4">
      <PageHeader
        title="Sessions"
        subtitle="Full training history"
        actions={
          <Link href="/sessions/new">
            <Button size="sm">
              <Plus className="h-4 w-4" /> New
            </Button>
          </Link>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState message="Could not load sessions." onRetry={() => void refetch()} />
      )}

      {!isLoading && !isError && (!sessions || sessions.length === 0) && (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="No sessions yet"
          hint="Every logged session appears here. Start with a new session."
          action={
            <Link href="/sessions/new">
              <Button size="sm">
                <Plus className="h-4 w-4" /> New session
              </Button>
            </Link>
          }
        />
      )}

      <div className="flex flex-col gap-2.5">
        {sessions?.map(({ session, client }) => (
          <Card key={session.id} className="p-4">
            <Link href={`/sessions/${session.id}`} className="block">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-text">{fmtDate(session.date)}</p>
                <Badge tone="accent">{client.fullName}</Badge>
              </div>
              {session.notes && (
                <p className="mt-1 line-clamp-1 text-[13px] text-muted">
                  {session.notes}
                </p>
              )}
            </Link>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void onCopy(session.id)}
                disabled={copySession.isPending}
              >
                <Copy className="h-4 w-4" /> Copy to new
              </Button>
              <div className="flex-1" />
              <Link href={`/sessions/${session.id}`}>
                <Button variant="outline" size="sm">
                  <Dumbbell className="h-4 w-4" /> Open
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(session.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete session?"
        message="The session is hidden from history. Past data is kept so copying and progress still work."
        confirmLabel="Delete"
        busy={deleteSession.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          void deleteSession.mutateAsync(confirmDelete).then(() => {
            setConfirmDelete(null);
          });
        }}
      />
    </div>
  );
}