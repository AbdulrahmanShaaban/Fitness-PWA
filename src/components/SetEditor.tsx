"use client";

import { History, Plus, Trash2 } from "lucide-react";
import { usePreviousPerformance } from "@/lib/hooks";
import { cn, fmtDate } from "@/lib/utils";
import { Badge, Spinner } from "./ui";

export interface SetDraft {
  id: string;
  weightKg: string;
  reps: string;
}

export interface ExerciseDraft {
  key: string;
  sessionExerciseId: string | null;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: SetDraft[];
}

function newSetDraft(): SetDraft {
  return { id: crypto.randomUUID(), weightKg: "", reps: "" };
}

export function newExerciseDraft(exercise: {
  id: string;
  name: string;
  muscleGroup: string;
}): ExerciseDraft {
  return {
    key: crypto.randomUUID(),
    sessionExerciseId: null,
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.muscleGroup,
    sets: [newSetDraft()],
  };
}

export function SetEditor({
  draft,
  clientId,
  beforeDate,
  onChange,
  onRemove,
}: {
  draft: ExerciseDraft;
  clientId: string | null;
  beforeDate: string;
  onChange: (next: ExerciseDraft) => void;
  onRemove: () => void;
}) {
  const { data: previous, isLoading } = usePreviousPerformance(
    clientId ?? "",
    draft.exerciseId,
    beforeDate
  );

  const updateSet = (setId: string, patch: Partial<SetDraft>) => {
    onChange({
      ...draft,
      sets: draft.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    });
  };

  const addSet = () => {
    onChange({ ...draft, sets: [...draft.sets, newSetDraft()] });
  };

  const removeSet = (setId: string) => {
    onChange({ ...draft, sets: draft.sets.filter((s) => s.id !== setId) });
  };

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-medium text-text">{draft.exerciseName}</p>
          <Badge>{draft.muscleGroup}</Badge>
        </div>
        <button
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger"
          aria-label={`Remove ${draft.exerciseName}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {clientId && (isLoading ? (
        <div className="mb-3 flex items-center gap-2 text-xs text-muted">
          <Spinner className="h-3 w-3" /> Loading previous performance...
        </div>
      ) : previous ? (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2">
          <History className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="text-xs font-medium text-muted">
            Last {fmtDate(previous.sessionDate)}:
          </span>
          {previous.sets.map((s) => (
            <span
              key={s.id}
              className="rounded-md bg-bg px-1.5 py-0.5 text-xs tabular-nums text-text"
            >
              {s.weightKg}kg × {s.reps}
            </span>
          ))}
        </div>
      ) : null)}

      <div className="flex flex-col gap-1.5">
        {draft.sets.map((set, index) => (
          <div key={set.id} className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-center text-xs font-medium text-muted tabular-nums">
              {index + 1}
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="kg"
              value={set.weightKg}
              onChange={(e) => updateSet(set.id, { weightKg: e.target.value })}
              className={cn(
                "h-10 w-full flex-1 rounded-lg border border-line bg-surface-2 px-3 text-center text-[15px] tabular-nums text-text placeholder:text-muted/50 outline-none focus:border-accent/60"
              )}
            />
            <span className="text-xs text-muted">kg</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              placeholder="reps"
              value={set.reps}
              onChange={(e) => updateSet(set.id, { reps: e.target.value })}
              className={cn(
                "h-10 w-full flex-1 rounded-lg border border-line bg-surface-2 px-3 text-center text-[15px] tabular-nums text-text placeholder:text-muted/50 outline-none focus:border-accent/60"
              )}
            />
            <span className="text-xs text-muted">reps</span>
            {draft.sets.length > 1 && (
              <button
                onClick={() => removeSet(set.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger"
                aria-label="Remove set"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addSet}
        className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:brightness-110"
      >
        <Plus className="h-4 w-4" /> Add set
      </button>
    </div>
  );
}