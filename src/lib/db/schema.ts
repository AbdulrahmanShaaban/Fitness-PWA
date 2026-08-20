export type Id = string;

export interface BaseRow {
  id: Id;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  isDeleted: boolean;
}

export interface Client extends BaseRow {
  fullName: string;
  phone: string | null;
  startDate: string;
  notes: string | null;
}

export interface Session extends BaseRow {
  clientId: Id;
  date: string;
  notes: string | null;
}

export interface SessionExercise extends BaseRow {
  sessionId: Id;
  exerciseId: Id;
  orderIndex: number;
}

export interface Set extends BaseRow {
  sessionExerciseId: Id;
  setNumber: number;
  reps: number;
  weightKg: number;
}

export interface Exercise extends BaseRow {
  name: string;
  muscleGroup: string;
  isDefault: boolean;
}

export interface Assessment extends BaseRow {
  clientId: Id;
  type: string;
  date: string;
  notes: string | null;
}

export interface AssessmentTest extends BaseRow {
  assessmentId: Id;
  testName: string;
  fields: Record<string, unknown>;
}

export interface ClientPhoto extends BaseRow {
  clientId: Id;
  assessmentId: Id | null;
  angle: string;
  date: string;
  blob: Blob | null;
  photoUrl: string | null;
}

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Legs",
  "Core",
  "Cardio",
  "Full Body",
] as const;

export const PHOTO_ANGLES = ["Front", "Side", "Back"] as const;

export function newId(): Id {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function newBaseRow(): BaseRow {
  const ts = nowIso();
  return {
    id: newId(),
    userId: null,
    createdAt: ts,
    updatedAt: ts,
    syncedAt: null,
    isDeleted: false,
  };
}

export function withUpdatedAt<T extends BaseRow>(row: T): T {
  return { ...row, updatedAt: nowIso(), syncedAt: null };
}