"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/overlays";
import { SessionForm } from "@/components/SessionForm";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import {
  useCopySession,
  useDeleteSession,
  useSessionDetail,
} from "@/lib/hooks";
import { errMsg, fmtDate } from "@/lib/utils";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: detail, isLoading, isError, refetch } = useSessionDetail(params.id);
  const deleteSession = useDeleteSession();
  const copySession = useCopySession();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="pt-4">
        <PageHeader title="Session" backHref="/sessions" />
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="pt-4">
        <PageHeader title="Session" backHref="/sessions" />
        <ErrorState message="Session not found." onRetry={() => void refetch()} />
      </div>
    );
  }

  const onCopy = async () => {
    setError(null);
    try {
      const newId = await copySession.mutateAsync([detail.session.id, undefined]);
      router.push(`/sessions/${newId}`);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const onDelete = async () => {
    await deleteSession.mutateAsync(detail.session.id);
    router.push("/sessions");
  };

  return (
    <div className="pt-4">
      <PageHeader
        title={fmtDate(detail.session.date)}
        subtitle={detail.client.fullName}
        backHref="/sessions"
        actions={
          editing ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-text"
                aria-label="Edit session"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-danger"
                aria-label="Delete session"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {editing ? (
        <SessionForm
          sessionId={detail.session.id}
          onDone={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {detail.session.notes && (
            <Card className="p-4">
              <p className="text-[13px] text-muted">{detail.session.notes}</p>
            </Card>
          )}

          {detail.exercises.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted">
              This session has no exercises yet. Edit it to add some.
            </Card>
          )}

          {detail.exercises.map((ex) => (
            <Card key={ex.sessionExercise.id} className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <p className="font-medium text-text">{ex.exercise.name}</p>
                <Badge>{ex.exercise.muscleGroup}</Badge>
              </div>
              <div className="flex flex-col gap-1">
                {ex.sets.map((set, index) => (
                  <div
                    key={set.id}
                    className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2"
                  >
                    <span className="w-5 text-center text-xs font-medium text-muted tabular-nums">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-[15px] tabular-nums text-text">
                      {set.weightKg} kg
                    </span>
                    <span className="text-[15px] tabular-nums text-muted">
                      × {set.reps} reps
                    </span>
                  </div>
                ))}
                {ex.sets.length === 0 && (
                  <p className="text-sm text-muted">No sets logged.</p>
                )}
              </div>
            </Card>
          ))}

          <Button variant="outline" onClick={() => void onCopy()}>
            <Copy className="h-4 w-4" /> Copy to a new session
          </Button>
          {!detail.client.isDeleted && (
            <p className="text-center text-xs text-muted">
              <Link href={`/clients/${detail.client.id}`} className="hover:text-text">
                View {detail.client.fullName}
              </Link>
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete session?"
        message="The session is hidden from history. Past data is kept so copying and progress still work."
        confirmLabel="Delete"
        busy={deleteSession.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}