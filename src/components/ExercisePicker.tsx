"use client";

import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MUSCLE_GROUPS, type Exercise } from "@/lib/db/schema";
import { useCreateExercise, useExercises } from "@/lib/hooks";
import { errMsg } from "@/lib/utils";
import { Badge, Button, EmptyState, Input, Select, Spinner } from "./ui";
import { Sheet } from "./overlays";

export function ExercisePicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
}) {
  const { data: exercises, isLoading, isError } = useExercises();
  const createExercise = useCreateExercise();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<string>(MUSCLE_GROUPS[0]);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
    );
  }, [exercises, query]);

  const submitNew = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      const created = await createExercise.mutateAsync({
        name: newName.trim(),
        muscleGroup: newGroup,
      });
      setNewName("");
      setCreating(false);
      onPick(created);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            className="pl-10"
            placeholder="Search exercises..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        )}

        {!isLoading && isError && (
          <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
            Could not load the exercise library.
          </p>
        )}

        {!isLoading && !isError && filtered.length === 0 && !creating && (
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="No exercises found"
            hint="Create a new exercise to add it to the library."
          />
        )}

        <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
          {filtered.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => {
                onPick(exercise);
                setQuery("");
              }}
              className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-left transition-colors hover:border-accent/40"
            >
              <span className="text-[15px] text-text">{exercise.name}</span>
              <Badge>{exercise.muscleGroup}</Badge>
            </button>
          ))}
        </div>

        {creating ? (
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2 p-3">
            <Input
              placeholder="Exercise name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <Select
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreating(false)}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={() => void submitNew()}>
                <Plus className="h-4 w-4" /> Create
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New exercise
          </Button>
        )}
      </div>
    </Sheet>
  );
}