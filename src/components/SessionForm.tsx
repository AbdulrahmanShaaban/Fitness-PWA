"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useClients,
  useCreateSession,
  useSessionDetail,
  useUpdateSession,
} from "@/lib/hooks";
import { errMsg, todayIso } from "@/lib/utils";
import {
  ExerciseDraft,
  newExerciseDraft,
  SetEditor,
} from "./SetEditor";
import { ExercisePicker } from "./ExercisePicker";
import { Button, EmptyState, ErrorState, Field, Input, Select, Spinner, Textarea } from "./ui";

export function SessionForm({
  sessionId,
  initialClientId,
  onDone,
}: {
  sessionId?: string;
  initialClientId?: string;
  onDone?: () => void;
}) {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: detail, isLoading: detailLoading } = useSessionDetail(sessionId);

  if (sessionId && detailLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (sessionId && !detail) {
    return <ErrorState message="Session not found." />;
  }

  return (
    <SessionFormInner
      key={detail?.session.id ?? "new"}
      clients={clients ?? []}
      clientsLoading={clientsLoading}
      initialClientId={detail?.client.id ?? initialClientId ?? ""}
      initialDate={detail?.session.date ?? todayIso()}
      initialNotes={detail?.session.notes ?? ""}
      initialExercises={
        detail
          ? detail.exercises.map((ex) => ({
              key: ex.sessionExercise.id,
              sessionExerciseId: ex.sessionExercise.id,
              exerciseId: ex.exercise.id,
              exerciseName: ex.exercise.name,
              muscleGroup: ex.exercise.muscleGroup,
              sets: ex.sets.map((s) => ({
                id: s.id,
                weightKg: String(s.weightKg),
                reps: String(s.reps),
              })),
            }))
          : []
      }
      sessionId={sessionId}
      onDone={onDone}
    />
  );
}

function SessionFormInner({
  clients,
  clientsLoading,
  initialClientId,
  initialDate,
  initialNotes,
  initialExercises,
  sessionId,
  onDone,
}: {
  clients: NonNullable<ReturnType<typeof useClients>["data"]>;
  clientsLoading: boolean;
  initialClientId: string;
  initialDate: string;
  initialNotes: string;
  initialExercises: ExerciseDraft[];
  sessionId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();

  const [clientId, setClientId] = useState<string>(initialClientId);
  const [date, setDate] = useState(initialDate);
  const [notes, setNotes] = useState(initialNotes);
  const [exercises, setExercises] = useState<ExerciseDraft[]>(initialExercises);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = createSession.isPending || updateSession.isPending;

  const submit = async () => {
    if (!clientId) {
      setError("Pick a client for this session");
      return;
    }
    if (!date) {
      setError("Pick a date");
      return;
    }
    if (exercises.length === 0) {
      setError("Add at least one exercise");
      return;
    }
    const parsed = exercises.map((ex) => ({
      sessionExerciseId: ex.sessionExerciseId,
      exerciseId: ex.exerciseId,
      sets: ex.sets.map((s) => ({
        id: s.id,
        reps: Number(s.reps) || 0,
        weightKg: Number(s.weightKg) || 0,
      })),
    }));
    setError(null);
    try {
      let id: string;
      if (sessionId) {
        await updateSession.mutateAsync([
          sessionId,
          { date, notes, exercises: parsed },
        ]);
        id = sessionId;
      } else {
        id = await createSession.mutateAsync({
          clientId,
          date,
          notes,
          exercises: parsed.map((ex) => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets.map((s) => ({ reps: s.reps, weightKg: s.weightKg })),
          })),
        });
      }
      if (onDone) onDone();
      else router.push(`/sessions/${id}`);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const pickExercise = (exercise: {
    id: string;
    name: string;
    muscleGroup: string;
  }) => {
    setExercises((prev) => [...prev, newExerciseDraft(exercise)]);
    setPickerOpen(false);
  };

  const updateExercise = (key: string, next: ExerciseDraft) => {
    setExercises((prev) => prev.map((e) => (e.key === key ? next : e)));
  };

  const removeExercise = (key: string) => {
    setExercises((prev) => prev.filter((e) => e.key !== key));
  };

  return (
    <div className="flex flex-col gap-4">
      {clientsLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !clients || clients.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-5 w-5" />}
          title="No clients yet"
          hint="Add a client first, then log their session."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/clients/new")}
            >
              Add client
            </Button>
          }
        />
      ) : (
        <>
          <Field label="Client">
            <Select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Pick a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Notes (optional)">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the session go?"
            />
          </Field>

          <div className="flex flex-col gap-3">
            {exercises.map((ex) => (
              <SetEditor
                key={ex.key}
                draft={ex}
                clientId={clientId || null}
                beforeDate={date}
                onChange={(next) => updateExercise(ex.key, next)}
                onRemove={() => removeExercise(ex.key)}
              />
            ))}
            {exercises.length === 0 && (
              <EmptyState
                icon={<Plus className="h-5 w-5" />}
                title="No exercises yet"
                hint="Tap Add Exercise to start building this session."
              />
            )}
          </div>

          <Button variant="outline" onClick={() => setPickerOpen(true)}>
            <Plus className="h-4 w-4" /> Add exercise
          </Button>

          {error && (
            <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <Button onClick={() => void submit()} loading={busy} size="lg">
            {sessionId ? "Save changes" : "Save session"}
          </Button>
        </>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={pickExercise}
      />
    </div>
  );
}