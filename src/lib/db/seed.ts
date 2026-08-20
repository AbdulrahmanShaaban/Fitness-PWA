import { db } from "./db";
import { newBaseRow, type Exercise } from "./schema";

const DEFAULT_EXERCISES: Array<Omit<Exercise, keyof import("./schema").BaseRow>> = [
  { name: "Bench Press", muscleGroup: "Chest", isDefault: true },
  { name: "Incline Dumbbell Press", muscleGroup: "Chest", isDefault: true },
  { name: "Cable Fly", muscleGroup: "Chest", isDefault: true },
  { name: "Push-Up", muscleGroup: "Chest", isDefault: true },
  { name: "Deadlift", muscleGroup: "Back", isDefault: true },
  { name: "Barbell Row", muscleGroup: "Back", isDefault: true },
  { name: "Lat Pulldown", muscleGroup: "Back", isDefault: true },
  { name: "Pull-Up", muscleGroup: "Back", isDefault: true },
  { name: "Overhead Press", muscleGroup: "Shoulders", isDefault: true },
  { name: "Lateral Raise", muscleGroup: "Shoulders", isDefault: true },
  { name: "Face Pull", muscleGroup: "Shoulders", isDefault: true },
  { name: "Barbell Curl", muscleGroup: "Arms", isDefault: true },
  { name: "Triceps Pushdown", muscleGroup: "Arms", isDefault: true },
  { name: "Hammer Curl", muscleGroup: "Arms", isDefault: true },
  { name: "Squat", muscleGroup: "Legs", isDefault: true },
  { name: "Leg Press", muscleGroup: "Legs", isDefault: true },
  { name: "Romanian Deadlift", muscleGroup: "Legs", isDefault: true },
  { name: "Leg Extension", muscleGroup: "Legs", isDefault: true },
  { name: "Leg Curl", muscleGroup: "Legs", isDefault: true },
  { name: "Calf Raise", muscleGroup: "Legs", isDefault: true },
  { name: "Plank", muscleGroup: "Core", isDefault: true },
  { name: "Hanging Leg Raise", muscleGroup: "Core", isDefault: true },
  { name: "Russian Twist", muscleGroup: "Core", isDefault: true },
  { name: "Treadmill Walk", muscleGroup: "Cardio", isDefault: true },
  { name: "Rowing Machine", muscleGroup: "Cardio", isDefault: true },
];

export async function seedDefaultExercisesIfEmpty(): Promise<void> {
  const count = await db.exercises.count();
  if (count > 0) return;
  await db.exercises.bulkAdd(
    DEFAULT_EXERCISES.map((e) => ({ ...e, ...newBaseRow() }))
  );
}