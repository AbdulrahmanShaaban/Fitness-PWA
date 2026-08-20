import { db } from "@/lib/db/db";
import type {
  Assessment,
  AssessmentTest,
  BaseRow,
  Client,
  ClientPhoto,
  Exercise,
  Session,
  SessionExercise,
  Set,
} from "@/lib/db/schema";
import { getMeta, setMeta } from "@/lib/repos/meta";
import { errMsg } from "@/lib/utils";
import { getSupabase } from "./supabase";

type AnyRow = BaseRow & Record<string, unknown>;

const TABLES: Array<{
  local: keyof CoachLogDbTables;
  remote: string;
  fields: Record<string, string>;
}> = [
  {
    local: "clients",
    remote: "clients",
    fields: {
      fullName: "full_name",
      phone: "phone",
      startDate: "start_date",
      notes: "notes",
    },
  },
  {
    local: "sessions",
    remote: "sessions",
    fields: { clientId: "client_id", date: "date", notes: "notes" },
  },
  {
    local: "sessionExercises",
    remote: "session_exercises",
    fields: {
      sessionId: "session_id",
      exerciseId: "exercise_id",
      orderIndex: "order_index",
    },
  },
  {
    local: "sets",
    remote: "sets",
    fields: {
      sessionExerciseId: "session_exercise_id",
      setNumber: "set_number",
      reps: "reps",
      weightKg: "weight_kg",
    },
  },
  {
    local: "exercises",
    remote: "exercises",
    fields: { name: "name", muscleGroup: "muscle_group", isDefault: "is_default" },
  },
  {
    local: "assessments",
    remote: "assessments",
    fields: { clientId: "client_id", type: "type", date: "date", notes: "notes" },
  },
  {
    local: "assessmentTests",
    remote: "assessment_tests",
    fields: {
      assessmentId: "assessment_id",
      testName: "test_name",
      fields: "fields",
    },
  },
  {
    local: "clientPhotos",
    remote: "client_photos",
    fields: {
      clientId: "client_id",
      assessmentId: "assessment_id",
      angle: "angle",
      date: "date",
      photoUrl: "photo_url",
    },
  },
];

interface CoachLogDbTables {
  clients: Client;
  sessions: Session;
  sessionExercises: SessionExercise;
  sets: Set;
  exercises: Exercise;
  assessments: Assessment;
  assessmentTests: AssessmentTest;
  clientPhotos: ClientPhoto;
}

const COMMON = {
  userId: "user_id",
  createdAt: "created_at",
  updatedAt: "updated_at",
  syncedAt: "synced_at",
  isDeleted: "is_deleted",
};

function toRemote(table: (typeof TABLES)[number], row: AnyRow): Record<string, unknown> {
  const out: Record<string, unknown> = { id: row.id };
  for (const [local, remote] of Object.entries(COMMON)) {
    out[remote] = row[local];
  }
  for (const [local, remote] of Object.entries(table.fields)) {
    out[remote] = row[local];
  }
  return out;
}

function toLocal(table: (typeof TABLES)[number], remote: Record<string, unknown>): AnyRow {
  const out: Record<string, unknown> = { id: remote.id };
  for (const [local, remoteKey] of Object.entries(COMMON)) {
    out[local] = remote[remoteKey];
  }
  for (const [local, remoteKey] of Object.entries(table.fields)) {
    out[local] = remote[remoteKey];
  }
  if (table.local === "clientPhotos") {
    out.blob = null;
  }
  return out as AnyRow;
}

function isDirty(row: BaseRow): boolean {
  return row.syncedAt === null || row.updatedAt > row.syncedAt;
}

async function pushTable(userId: string, table: (typeof TABLES)[number]): Promise<number> {
  const localTable = db[table.local] as TableLike;
  const rows = (await localTable.toArray()) as AnyRow[];
  const dirty = rows.filter(isDirty);
  if (dirty.length === 0) return 0;

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  if (table.local === "clientPhotos") {
    for (const row of dirty) {
      const photo = row as unknown as ClientPhoto;
      if (photo.blob && !photo.photoUrl) {
        const { error } = await supabase.storage
          .from("client-photos")
          .upload(`${userId}/${photo.id}.jpg`, photo.blob, {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        photo.photoUrl = supabase.storage
          .from("client-photos")
          .getPublicUrl(`${userId}/${photo.id}.jpg`).data.publicUrl;
      }
    }
  }

  const { error } = await supabase
    .from(table.remote)
    .upsert(dirty.map((row) => toRemote(table, { ...row, userId })), {
      onConflict: "id",
    });
  if (error) throw new Error(`${table.remote} sync failed: ${error.message}`);

  const now = new Date().toISOString();
  for (const row of dirty) {
    await localTable.put({ ...row, syncedAt: now, userId });
  }
  return dirty.length;
}

interface TableLike {
  toArray(): Promise<unknown[]>;
  put(row: unknown): Promise<unknown>;
  get(id: string): Promise<unknown | undefined>;
}

async function pullTable(userId: string, table: (typeof TABLES)[number]): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const lastPulledAt = await getMeta<string>(`pull_${table.remote}`);
  let query = supabase
    .from(table.remote)
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: true });
  if (lastPulledAt) query = query.gte("updated_at", lastPulledAt);

  const { data, error } = await query;
  if (error) throw new Error(`${table.remote} pull failed: ${error.message}`);

  const localTable = db[table.local] as TableLike;
  let newest = lastPulledAt;
  let count = 0;
  for (const remote of data ?? []) {
    const remoteUpdatedAt = String(remote.updated_at ?? "");
    if (remoteUpdatedAt > (newest ?? "")) newest = remoteUpdatedAt;
    const local = (await localTable.get(String(remote.id))) as
      | AnyRow
      | undefined;
    if (local && local.updatedAt >= remoteUpdatedAt) continue;
    await localTable.put(toLocal(table, remote));
    count += 1;
  }
  await setMeta(`pull_${table.remote}`, newest ?? new Date().toISOString());
  return count;
}

export async function syncNow(userId: string): Promise<{
  pushed: number;
  pulled: number;
}> {
  let pushed = 0;
  let pulled = 0;
  try {
    for (const table of TABLES) {
      pushed += await pushTable(userId, table);
    }
    for (const table of TABLES) {
      pulled += await pullTable(userId, table);
    }
    return { pushed, pulled };
  } catch (e) {
    console.error("sync failed", e);
    throw new Error(errMsg(e));
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user.id;
}

export async function login(email: string, password: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
}

export async function logout(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getSessionEmail(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}