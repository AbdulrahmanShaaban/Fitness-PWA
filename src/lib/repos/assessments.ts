import { db } from "@/lib/db/db";
import {
  newBaseRow,
  newId,
  withUpdatedAt,
  type Assessment,
  type AssessmentTest,
  type ClientPhoto,
} from "@/lib/db/schema";

export interface TestInput {
  id: string | null;
  testName: string;
  fields: Record<string, unknown>;
}

export interface PhotoInput {
  id: string | null;
  angle: string;
  date: string;
  blob: Blob | null;
  photoUrl: string | null;
}

export interface AssessmentInput {
  clientId: string;
  type: string;
  date: string;
  notes: string | null;
  tests: TestInput[];
  photos: PhotoInput[];
}

export interface AssessmentDetail {
  assessment: Assessment;
  tests: AssessmentTest[];
  photos: ClientPhoto[];
}

export async function createAssessment(
  input: AssessmentInput
): Promise<string> {
  const assessmentId = newId();
  await db.transaction(
    "rw",
    db.assessments,
    db.assessmentTests,
    db.clientPhotos,
    async () => {
      const assessment: Assessment = {
        ...newBaseRow(),
        id: assessmentId,
        clientId: input.clientId,
        type: input.type,
        date: input.date,
        notes: input.notes?.trim() || null,
      };
      await db.assessments.add(assessment);
      for (const t of input.tests) {
        const row: AssessmentTest = {
          ...newBaseRow(),
          assessmentId,
          testName: t.testName,
          fields: t.fields,
        };
        await db.assessmentTests.add(row);
      }
      for (const p of input.photos) {
        const row: ClientPhoto = {
          ...newBaseRow(),
          id: p.id ?? newId(),
          clientId: input.clientId,
          assessmentId,
          angle: p.angle,
          date: p.date,
          blob: p.blob,
          photoUrl: p.photoUrl,
        };
        await db.clientPhotos.add(row);
      }
    }
  );
  return assessmentId;
}

export async function updateAssessment(
  assessmentId: string,
  input: Omit<AssessmentInput, "clientId">
): Promise<void> {
  const assessment = await db.assessments.get(assessmentId);
  if (!assessment) throw new Error("Assessment not found");

  await db.transaction(
    "rw",
    db.assessments,
    db.assessmentTests,
    db.clientPhotos,
    async () => {
      await db.assessments.put(
        withUpdatedAt({
          ...assessment,
          type: input.type,
          date: input.date,
          notes: input.notes?.trim() || null,
        })
      );

      const existingTests = await db.assessmentTests
        .where("assessmentId")
        .equals(assessmentId)
        .toArray();
      const keptTestIds = new Set<string>();
      for (const t of input.tests) {
        if (t.id) {
          const existing = existingTests.find((x) => x.id === t.id);
          if (existing) {
            await db.assessmentTests.put(
              withUpdatedAt({
                ...existing,
                testName: t.testName,
                fields: t.fields,
              })
            );
            keptTestIds.add(t.id);
          }
        } else {
          const row: AssessmentTest = {
            ...newBaseRow(),
            assessmentId,
            testName: t.testName,
            fields: t.fields,
          };
          await db.assessmentTests.add(row);
          keptTestIds.add(row.id);
        }
      }
      for (const removed of existingTests.filter(
        (t) => !keptTestIds.has(t.id)
      )) {
        await db.assessmentTests.put(
          withUpdatedAt({ ...removed, isDeleted: true })
        );
      }

      const existingPhotos = await db.clientPhotos
        .where("assessmentId")
        .equals(assessmentId)
        .toArray();
      const keptPhotoIds = new Set<string>();
      for (const p of input.photos) {
        if (p.id) {
          const existing = existingPhotos.find((x) => x.id === p.id);
          if (existing) {
            await db.clientPhotos.put(
              withUpdatedAt({
                ...existing,
                angle: p.angle,
                date: p.date,
                blob: p.blob ?? existing.blob,
                photoUrl: p.photoUrl ?? existing.photoUrl,
              })
            );
            keptPhotoIds.add(p.id);
          }
        } else {
          const row: ClientPhoto = {
            ...newBaseRow(),
            clientId: assessment.clientId,
            assessmentId,
            angle: p.angle,
            date: p.date,
            blob: p.blob,
            photoUrl: p.photoUrl,
          };
          await db.clientPhotos.add(row);
          keptPhotoIds.add(row.id);
        }
      }
      for (const removed of existingPhotos.filter(
        (p) => !keptPhotoIds.has(p.id)
      )) {
        await db.clientPhotos.put(
          withUpdatedAt({ ...removed, isDeleted: true })
        );
      }
    }
  );
}

export async function softDeleteAssessment(id: string): Promise<void> {
  const assessment = await db.assessments.get(id);
  if (!assessment) throw new Error("Assessment not found");
  await db.assessments.put(withUpdatedAt({ ...assessment, isDeleted: true }));
}

export async function listAssessmentsForClient(
  clientId: string
): Promise<Assessment[]> {
  const rows = await db.assessments
    .where("clientId")
    .equals(clientId)
    .and((a) => !a.isDeleted)
    .sortBy("date");
  return rows.reverse();
}

export async function getAssessmentDetail(
  assessmentId: string
): Promise<AssessmentDetail | null> {
  const assessment = await db.assessments.get(assessmentId);
  if (!assessment || assessment.isDeleted) return null;
  const tests = await db.assessmentTests
    .where("assessmentId")
    .equals(assessmentId)
    .and((t) => !t.isDeleted)
    .sortBy("createdAt");
  const photos = await db.clientPhotos
    .where("assessmentId")
    .equals(assessmentId)
    .and((p) => !p.isDeleted)
    .sortBy("createdAt");
  return { assessment, tests, photos };
}

export async function getWeightSeries(
  clientId: string
): Promise<Array<{ date: string; weight: number }>> {
  const assessments = await db.assessments
    .where("clientId")
    .equals(clientId)
    .and((a) => !a.isDeleted && a.type === "body-measurements")
    .sortBy("date");
  const series: Array<{ date: string; weight: number }> = [];
  for (const assessment of assessments) {
    const tests = await db.assessmentTests
      .where("assessmentId")
      .equals(assessment.id)
      .and((t) => !t.isDeleted && t.testName === "Body Measurements")
      .toArray();
    for (const test of tests) {
      const weight = Number(test.fields.weight);
      if (Number.isFinite(weight) && weight > 0) {
        series.push({ date: assessment.date, weight });
      }
    }
  }
  return series;
}