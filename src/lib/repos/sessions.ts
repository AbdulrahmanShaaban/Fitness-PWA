import { db } from "@/lib/db/db";
import {
  newBaseRow,
  newId,
  nowIso,
  withUpdatedAt,
  type Client,
  type Exercise,
  type Session,
  type SessionExercise,
  type Set,
} from "@/lib/db/schema";

export interface SetInput {
  reps: number;
  weightKg: number;
}

export interface ExerciseWithSetsInput {
  exerciseId: string;
  sets: SetInput[];
}

export interface SessionInput {
  clientId: string;
  date: string;
  notes: string | null;
  exercises: ExerciseWithSetsInput[];
}

export interface SessionWithClient {
  session: Session;
  client: Client;
}

export interface SessionExerciseDetail {
  sessionExercise: SessionExercise;
  exercise: Exercise;
  sets: Set[];
}

export interface SessionDetail {
  session: Session;
  client: Client;
  exercises: SessionExerciseDetail[];
}

export async function createSession(input: SessionInput): Promise<string> {
  const sessionId = newId();
  await db.transaction(
    "rw",
    db.sessions,
    db.sessionExercises,
    db.sets,
    async () => {
      const session: Session = {
        ...newBaseRow(),
        id: sessionId,
        clientId: input.clientId,
        date: input.date,
        notes: input.notes?.trim() || null,
      };
      await db.sessions.add(session);
      let orderIndex = 0;
      for (const ex of input.exercises) {
        const se: SessionExercise = {
          ...newBaseRow(),
          sessionId,
          exerciseId: ex.exerciseId,
          orderIndex,
        };
        await db.sessionExercises.add(se);
        orderIndex += 1;
        await addSets(se.id, ex.sets);
      }
    }
  );
  return sessionId;
}

async function addSets(
  sessionExerciseId: string,
  sets: SetInput[]
): Promise<void> {
  let setNumber = 1;
  for (const s of sets) {
    const row: Set = {
      ...newBaseRow(),
      sessionExerciseId,
      setNumber,
      reps: s.reps,
      weightKg: s.weightKg,
    };
    await db.sets.add(row);
    setNumber += 1;
  }
}

export interface UpdateSessionInput {
  date: string;
  notes: string | null;
  exercises: Array<{
    sessionExerciseId: string | null;
    exerciseId: string;
    sets: Array<{ id: string | null; reps: number; weightKg: number }>;
  }>;
}

export async function updateSession(
  sessionId: string,
  input: UpdateSessionInput
): Promise<void> {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error("Session not found");
  await db.transaction(
    "rw",
    db.sessions,
    db.sessionExercises,
    db.sets,
    async () => {
      await db.sessions.put(
        withUpdatedAt({
          ...session,
          date: input.date,
          notes: input.notes?.trim() || null,
        })
      );

      const existingSes = await db.sessionExercises
        .where("sessionId")
        .equals(sessionId)
        .toArray();

      const keptSeIds = new Set<string>();
      let orderIndex = 0;
      for (const ex of input.exercises) {
        let se: SessionExercise;
        if (ex.sessionExerciseId) {
          const existing = existingSes.find(
            (e) => e.id === ex.sessionExerciseId
          );
          if (!existing) throw new Error("Exercise entry not found in session");
          se = withUpdatedAt({ ...existing, orderIndex });
          await db.sessionExercises.put(se);
          keptSeIds.add(se.id);
        } else {
          se = {
            ...newBaseRow(),
            sessionId,
            exerciseId: ex.exerciseId,
            orderIndex,
          };
          await db.sessionExercises.add(se);
          keptSeIds.add(se.id);
        }
        orderIndex += 1;

        const existingSets = await db.sets
          .where("sessionExerciseId")
          .equals(se.id)
          .toArray();
        const keptSetIds = new Set<string>();
        let setNumber = 1;
        for (const s of ex.sets) {
          if (s.id) {
            const existingSet = existingSets.find((x) => x.id === s.id);
            if (existingSet) {
              await db.sets.put(
                withUpdatedAt({
                  ...existingSet,
                  setNumber,
                  reps: s.reps,
                  weightKg: s.weightKg,
                })
              );
              keptSetIds.add(s.id);
            }
          } else {
            const row: Set = {
              ...newBaseRow(),
              sessionExerciseId: se.id,
              setNumber,
              reps: s.reps,
              weightKg: s.weightKg,
            };
            await db.sets.add(row);
            keptSetIds.add(row.id);
          }
          setNumber += 1;
        }
        for (const removed of existingSets.filter(
          (s) => !keptSetIds.has(s.id)
        )) {
          await db.sets.put(withUpdatedAt({ ...removed, isDeleted: true }));
        }
      }
      for (const removed of existingSes.filter((e) => !keptSeIds.has(e.id))) {
        await db.sessionExercises.put(
          withUpdatedAt({ ...removed, isDeleted: true })
        );
        const orphanSets = await db.sets
          .where("sessionExerciseId")
          .equals(removed.id)
          .toArray();
        for (const s of orphanSets) {
          await db.sets.put(withUpdatedAt({ ...s, isDeleted: true }));
        }
      }
    }
  );
}

export async function softDeleteSession(id: string): Promise<void> {
  const session = await db.sessions.get(id);
  if (!session) throw new Error("Session not found");
  await db.sessions.put(withUpdatedAt({ ...session, isDeleted: true }));
}

export async function listSessions(): Promise<SessionWithClient[]> {
  const sessions = await db.sessions
    .filter((s) => !s.isDeleted)
    .sortBy("date");
  const clients = new Map<string, Client>();
  const result: SessionWithClient[] = [];
  for (const session of sessions.reverse()) {
    let client = clients.get(session.clientId);
    if (!client) {
      client = await db.clients.get(session.clientId);
      if (!client || client.isDeleted) continue;
      clients.set(session.clientId, client);
    }
    result.push({ session, client });
  }
  return result;
}

export async function listSessionsForClient(
  clientId: string
): Promise<Session[]> {
  const sessions = await db.sessions
    .where("clientId")
    .equals(clientId)
    .and((s) => !s.isDeleted)
    .sortBy("date");
  return sessions.reverse();
}

export async function getSessionDetail(
  sessionId: string
): Promise<SessionDetail | null> {
  const session = await db.sessions.get(sessionId);
  if (!session || session.isDeleted) return null;
  const client = await db.clients.get(session.clientId);
  if (!client) return null;

  const ses = await db.sessionExercises
    .where("sessionId")
    .equals(sessionId)
    .and((se) => !se.isDeleted)
    .sortBy("orderIndex");

  const exercises: SessionExerciseDetail[] = [];
  for (const se of ses) {
    const exercise = await db.exercises.get(se.exerciseId);
    if (!exercise || exercise.isDeleted) continue;
    const sets = await db.sets
      .where("sessionExerciseId")
      .equals(se.id)
      .and((s) => !s.isDeleted)
      .sortBy("setNumber");
    exercises.push({ sessionExercise: se, exercise, sets });
  }
  return { session, client, exercises };
}

export async function getSessionCountForClient(
  clientId: string
): Promise<number> {
  return db.sessions
    .where("clientId")
    .equals(clientId)
    .and((s) => !s.isDeleted)
    .count();
}

export async function getLastSessionDate(
  clientId: string
): Promise<string | null> {
  const sessions = await db.sessions
    .where("clientId")
    .equals(clientId)
    .and((s) => !s.isDeleted)
    .sortBy("date");
  if (sessions.length === 0) return null;
  return sessions[sessions.length - 1].date;
}

export interface PreviousPerformance {
  sessionId: string;
  sessionDate: string;
  sets: Set[];
}

export async function getPreviousPerformance(
  clientId: string,
  exerciseId: string,
  beforeDate: string
): Promise<PreviousPerformance | null> {
  const sessions = await db.sessions
    .where("clientId")
    .equals(clientId)
    .and((s) => !s.isDeleted && s.date < beforeDate)
    .sortBy("date");
  if (sessions.length === 0) return null;
  const session = sessions[sessions.length - 1];

  const ses = await db.sessionExercises
    .where("sessionId")
    .equals(session.id)
    .and((se) => !se.isDeleted && se.exerciseId === exerciseId)
    .toArray();
  if (ses.length === 0) return null;

  const sets = await db.sets
    .where("sessionExerciseId")
    .equals(ses[0].id)
    .and((s) => !s.isDeleted)
    .sortBy("setNumber");
  if (sets.length === 0) return null;

  return { sessionId: session.id, sessionDate: session.date, sets };
}

export async function copySession(
  sessionId: string,
  targetDate?: string
): Promise<string> {
  const detail = await getSessionDetail(sessionId);
  if (!detail) throw new Error("Session not found");

  const newSessionId = newId();
  await db.transaction(
    "rw",
    db.sessions,
    db.sessionExercises,
    db.sets,
    async () => {
      const session: Session = {
        ...newBaseRow(),
        id: newSessionId,
        clientId: detail.client.id,
        date: targetDate ?? nowIso().slice(0, 10),
        notes: detail.session.notes,
      };
      await db.sessions.add(session);
      for (const ex of detail.exercises) {
        const se: SessionExercise = {
          ...newBaseRow(),
          sessionId: newSessionId,
          exerciseId: ex.exercise.id,
          orderIndex: ex.sessionExercise.orderIndex,
        };
        await db.sessionExercises.add(se);
        for (const s of ex.sets) {
          const row: Set = {
            ...newBaseRow(),
            sessionExerciseId: se.id,
            setNumber: s.setNumber,
            reps: s.reps,
            weightKg: s.weightKg,
          };
          await db.sets.add(row);
        }
      }
    }
  );
  return newSessionId;
}

export async function getStrengthSeries(
  clientId: string,
  exerciseId: string
): Promise<Array<{ date: string; maxKg: number }>> {
  const sessions = await db.sessions
    .where("clientId")
    .equals(clientId)
    .and((s) => !s.isDeleted)
    .sortBy("date");

  const series: Array<{ date: string; maxKg: number }> = [];
  for (const session of sessions) {
    const ses = await db.sessionExercises
      .where("sessionId")
      .equals(session.id)
      .and((se) => !se.isDeleted && se.exerciseId === exerciseId)
      .toArray();
    if (ses.length === 0) continue;
    const sets = await db.sets
      .where("sessionExerciseId")
      .equals(ses[0].id)
      .and((s) => !s.isDeleted)
      .toArray();
    if (sets.length === 0) continue;
    const maxKg = Math.max(...sets.map((s) => s.weightKg));
    series.push({ date: session.date, maxKg });
  }
  return series;
}