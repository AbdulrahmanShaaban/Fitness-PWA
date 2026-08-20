import { db } from "@/lib/db/db";

export async function exportAllData(): Promise<void> {
  const [clients, sessions, sessionExercises, sets, exercises, assessments, assessmentTests, clientPhotos] =
    await Promise.all([
      db.clients.toArray(),
      db.sessions.toArray(),
      db.sessionExercises.toArray(),
      db.sets.toArray(),
      db.exercises.toArray(),
      db.assessments.toArray(),
      db.assessmentTests.toArray(),
      db.clientPhotos.toArray(),
    ]);

  const payload = {
    app: "coach-log",
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      clients,
      sessions,
      sessionExercises,
      sets,
      exercises,
      assessments,
      assessmentTests,
      clientPhotos,
    },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `coach-log-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}