import Dexie, { type Table } from "dexie";
import type {
  Assessment,
  AssessmentTest,
  Client,
  ClientPhoto,
  Exercise,
  Session,
  SessionExercise,
  Set,
} from "./schema";

export class CoachLogDB extends Dexie {
  clients!: Table<Client, string>;
  sessions!: Table<Session, string>;
  sessionExercises!: Table<SessionExercise, string>;
  sets!: Table<Set, string>;
  exercises!: Table<Exercise, string>;
  assessments!: Table<Assessment, string>;
  assessmentTests!: Table<AssessmentTest, string>;
  clientPhotos!: Table<ClientPhoto, string>;
  meta!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super("coach-log");
    this.version(1).stores({
      clients: "id, userId, fullName, startDate, updatedAt, syncedAt, isDeleted",
      sessions: "id, clientId, date, updatedAt, syncedAt, isDeleted",
      sessionExercises: "id, sessionId, exerciseId, orderIndex, updatedAt, syncedAt, isDeleted",
      sets: "id, sessionExerciseId, setNumber, updatedAt, syncedAt, isDeleted",
      exercises: "id, name, muscleGroup, updatedAt, syncedAt, isDeleted",
      assessments: "id, clientId, type, date, updatedAt, syncedAt, isDeleted",
      assessmentTests: "id, assessmentId, testName, updatedAt, syncedAt, isDeleted",
      clientPhotos: "id, clientId, assessmentId, angle, date, updatedAt, syncedAt, isDeleted",
      meta: "key",
    });
  }
}

export const db = new CoachLogDB();