"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Camera,
  ChevronRight,
  ClipboardList,
  Dumbbell,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/overlays";
import { StrengthChart, WeightChart } from "@/components/charts";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { getTestTypeLabel } from "@/lib/assessments-config";
import { useAssessments, useClient, useClientSessions, useDeleteClient, useExercises } from "@/lib/hooks";
import { clientInitials, formatPhone } from "@/lib/repos/clients";
import { fmtDate } from "@/lib/utils";

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading, isError, refetch } = useClient(params.id);
  const { data: sessions, isLoading: sessionsLoading } = useClientSessions(params.id);
  const { data: assessments, isLoading: assessmentsLoading } = useAssessments(params.id);
  const { data: exercises } = useExercises();
  const deleteClient = useDeleteClient();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [strengthExercise, setStrengthExercise] = useState("");

  if (isLoading) {
    return (
      <div className="pt-4">
        <PageHeader title="Client" backHref="/" />
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="pt-4">
        <PageHeader title="Client" backHref="/" />
        <ErrorState message="Client not found." onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <PageHeader
        title={client.fullName}
        subtitle={`Client since ${fmtDate(client.startDate)}`}
        backHref="/"
        actions={
          <>
            <Link
              href={`/clients/${client.id}/edit`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-text"
              aria-label="Edit client"
            >
              <Pencil className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-danger"
              aria-label="Delete client"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        }
      />

      <Card className="mb-5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 font-display font-bold text-accent">
            {clientInitials(client.fullName)}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] text-text">{formatPhone(client.phone)}</p>
            {client.notes && (
              <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">
                {client.notes}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatCard
            icon={<Dumbbell className="h-4 w-4" />}
            label="Sessions"
            value={String(sessions?.length ?? 0)}
          />
          <StatCard
            icon={<Activity className="h-4 w-4" />}
            label="Last session"
            value={sessions?.[0] ? fmtDate(sessions[0].date) : "None yet"}
          />
        </div>
      </Card>

      <SectionTitle
        title="Sessions"
        action={
          <Link href={`/sessions/new?clientId=${client.id}`}>
            <Button size="sm">
              <Plus className="h-4 w-4" /> New
            </Button>
          </Link>
        }
      />
      {sessionsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="No sessions yet"
          hint="Log the first session to start the training history."
        />
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="flex items-center justify-between p-3.5">
                <div>
                  <p className="font-medium text-text">{fmtDate(session.date)}</p>
                  {session.notes && (
                    <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
                      {session.notes}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Card>
            </Link>
          ))}
        </div>
      )}

      <SectionTitle
        title="Assessments"
        action={
          <Link href={`/clients/${client.id}/assessments/new`}>
            <Button size="sm">
              <Plus className="h-4 w-4" /> New
            </Button>
          </Link>
        }
      />
      {assessmentsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !assessments || assessments.length === 0 ? (
        <EmptyState
          icon={<Camera className="h-5 w-5" />}
          title="No assessments yet"
          hint="Body measurements, photos and fitness tests go here."
        />
      ) : (
        <div className="mb-6 flex flex-col gap-2">
          {assessments.map((assessment) => (
            <Link
              key={assessment.id}
              href={`/clients/${client.id}/assessments/${assessment.id}`}
            >
              <Card className="flex items-center justify-between p-3.5">
                <p className="font-medium text-text">
                  {getTestTypeLabel(assessment.type)}
                </p>
                <Badge>{fmtDate(assessment.date)}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <SectionTitle title="Progress" />
      <Card className="mb-3 p-4">
        <p className="mb-3 text-sm font-medium text-muted">Weight</p>
        <WeightChart clientId={client.id} />
      </Card>
      <Card className="p-4">
        <p className="mb-3 text-sm font-medium text-muted">Strength curve</p>
        <Select
          className="mb-3"
          value={strengthExercise}
          onChange={(e) => setStrengthExercise(e.target.value)}
        >
          <option value="">Pick an exercise</option>
          {(exercises ?? []).map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </Select>
        <StrengthChart clientId={client.id} exerciseId={strengthExercise || null} />
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete client?"
        message="This hides the client and their history. Nothing is permanently erased and the backup still holds the data."
        confirmLabel="Delete client"
        busy={deleteClient.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          void deleteClient.mutateAsync(client.id).then(() => {
            router.push("/");
          });
        }}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 truncate text-[15px] font-semibold text-text tabular-nums">
        {value}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="font-display text-base font-semibold text-text">{title}</h2>
      {action}
    </div>
  );
}