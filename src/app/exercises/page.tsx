"use client";

import { useMemo, useState } from "react";
import { Check, Library, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/overlays";
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import { MUSCLE_GROUPS } from "@/lib/db/schema";
import {
  useCreateExercise,
  useDeleteExercise,
  useExercises,
  useUpdateExercise,
} from "@/lib/hooks";
import { errMsg } from "@/lib/utils";

export default function ExercisesPage() {
  const { data: exercises, isLoading, isError, refetch } = useExercises();
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState<string>(MUSCLE_GROUPS[0]);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
    );
  }, [exercises, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const exercise of filtered) {
      const list = map.get(exercise.muscleGroup) ?? [];
      list.push(exercise);
      map.set(exercise.muscleGroup, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const submitCreate = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await createExercise.mutateAsync({ name: name.trim(), muscleGroup: group });
      setName("");
      setShowForm(false);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const submitEdit = async (id: string) => {
    setError(null);
    try {
      await updateExercise.mutateAsync([id, { name: editName, muscleGroup: editGroup }]);
      setEditingId(null);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="pt-4">
      <PageHeader
        title="Exercise library"
        subtitle={`${exercises?.length ?? 0} exercises`}
        actions={
          <Button size="sm" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        }
      />

      {error && (
        <p className="mb-4 rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {showForm && (
        <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4">
          <Input
            placeholder="Exercise name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Select value={group} onChange={(e) => setGroup(e.target.value)}>
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void submitCreate()}>
              <Check className="h-4 w-4" /> Create
            </Button>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          className="pl-10"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      )}

      {!isLoading && isError && (
        <ErrorState message="Could not load the exercise library." onRetry={() => void refetch()} />
      )}

      {!isLoading && !isError && (!exercises || exercises.length === 0) && (
        <EmptyState
          icon={<Library className="h-5 w-5" />}
          title="Library is empty"
          hint="The default exercise list is created on first use. Add one now."
        />
      )}

      <div className="flex flex-col gap-5">
        {grouped.map(([muscleGroup, list]) => (
          <div key={muscleGroup}>
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-muted">
              {muscleGroup}
            </h2>
            <div className="flex flex-col gap-1.5">
              {list.map((exercise) =>
                editingId === exercise.id ? (
                  <div
                    key={exercise.id}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3"
                  >
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                    <Select
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                    >
                      {MUSCLE_GROUPS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                      <Button size="sm" onClick={() => void submitEdit(exercise.id)}>
                        <Check className="h-4 w-4" /> Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] text-text">
                        {exercise.name}
                      </p>
                      {exercise.isDefault && (
                        <p className="text-[11px] text-muted">Default library</p>
                      )}
                    </div>
                    <Badge>{exercise.muscleGroup}</Badge>
                    <button
                      onClick={() => {
                        setEditingId(exercise.id);
                        setEditName(exercise.name);
                        setEditGroup(exercise.muscleGroup);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-text"
                      aria-label={`Edit ${exercise.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(exercise.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-danger"
                      aria-label={`Delete ${exercise.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete exercise?"
        message="Exercises already used in sessions cannot be deleted."
        confirmLabel="Delete"
        busy={deleteExercise.isPending}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          void deleteExercise
            .mutateAsync(confirmDelete)
            .catch((e) => setError(errMsg(e)))
            .then(() => setConfirmDelete(null));
        }}
      />
    </div>
  );
}