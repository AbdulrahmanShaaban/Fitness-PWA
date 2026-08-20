import { db } from "@/lib/db/db";
import { newBaseRow, withUpdatedAt, type Exercise } from "@/lib/db/schema";

export interface ExerciseInput {
  name: string;
  muscleGroup: string;
}

export async function listExercises(): Promise<Exercise[]> {
  return db.exercises.filter((e) => !e.isDeleted).sortBy("name");
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const row: Exercise = {
    ...newBaseRow(),
    name: input.name.trim(),
    muscleGroup: input.muscleGroup,
    isDefault: false,
  };
  await db.exercises.add(row);
  return row;
}

export async function updateExercise(
  id: string,
  input: Partial<ExerciseInput>
): Promise<Exercise> {
  const existing = await db.exercises.get(id);
  if (!existing) throw new Error("Exercise not found");
  const next: Exercise = withUpdatedAt({
    ...existing,
    ...(input.name !== undefined ? { name: input.name.trim() } : {}),
    ...(input.muscleGroup !== undefined
      ? { muscleGroup: input.muscleGroup }
      : {}),
  });
  await db.exercises.put(next);
  return next;
}

export async function isExerciseUsed(exerciseId: string): Promise<boolean> {
  const count = await db.sessionExercises
    .where("exerciseId")
    .equals(exerciseId)
    .and((se) => !se.isDeleted)
    .count();
  return count > 0;
}

export async function softDeleteExercise(id: string): Promise<void> {
  const existing = await db.exercises.get(id);
  if (!existing) throw new Error("Exercise not found");
  if (await isExerciseUsed(id)) {
    throw new Error(
      "This exercise is used in past sessions and cannot be deleted"
    );
  }
  await db.exercises.put(withUpdatedAt({ ...existing, isDeleted: true }));
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}