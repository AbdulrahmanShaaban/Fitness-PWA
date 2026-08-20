"use client";

import { Camera, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { ASSESSMENT_TEST_TYPES } from "@/lib/assessments-config";
import { PHOTO_ANGLES, type ClientPhoto } from "@/lib/db/schema";
import { useCreateAssessment, useUpdateAssessment } from "@/lib/hooks";
import { errMsg, todayIso } from "@/lib/utils";
import { Button, Field, Input, Select, Textarea } from "./ui";

export interface TestDraft {
  key: string;
  id: string | null;
  typeId: string;
  fields: Record<string, string>;
}

export interface PhotoDraft {
  key: string;
  id: string | null;
  angle: string;
  file: File | null;
  preview: string | null;
  existingUrl: string | null;
  existingBlob: Blob | null;
}

export function newTestDraft(typeId: string): TestDraft {
  return { key: crypto.randomUUID(), id: null, typeId, fields: {} };
}

export function newPhotoDraft(): PhotoDraft {
  return {
    key: crypto.randomUUID(),
    id: null,
    angle: PHOTO_ANGLES[0],
    file: null,
    preview: null,
    existingUrl: null,
    existingBlob: null,
  };
}

export function AssessmentForm({
  clientId,
  assessmentId,
  initialTests,
  initialPhotos,
  initialType,
  initialDate,
  initialNotes,
  onCancel,
  onSubmit,
}: {
  clientId: string;
  assessmentId?: string;
  initialTests?: TestDraft[];
  initialPhotos?: PhotoDraft[];
  initialType?: string;
  initialDate?: string;
  initialNotes?: string;
  onCancel?: () => void;
  onSubmit?: () => void;
}) {
  const [type, setType] = useState(initialType ?? "");
  const [date, setDate] = useState(initialDate ?? todayIso());
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [tests, setTests] = useState<TestDraft[]>(initialTests ?? []);
  const [photos, setPhotos] = useState<PhotoDraft[]>(initialPhotos ?? []);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();

  const addTest = (typeId: string) => {
    setTests((prev) => [...prev, newTestDraft(typeId)]);
  };

  const updateTest = (key: string, patch: Partial<TestDraft>) => {
    setTests((prev) =>
      prev.map((t) => (t.key === key ? { ...t, ...patch } : t))
    );
  };

  const removeTest = (key: string) => {
    setTests((prev) => prev.filter((t) => t.key !== key));
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    const added: PhotoDraft[] = Array.from(files).map((file) => ({
      key: crypto.randomUUID(),
      id: null,
      angle: PHOTO_ANGLES[0],
      file,
      preview: URL.createObjectURL(file),
      existingUrl: null,
      existingBlob: null,
    }));
    setPhotos((prev) => [...prev, ...added]);
  };

  const updatePhoto = (key: string, patch: Partial<PhotoDraft>) => {
    setPhotos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p))
    );
  };

  const removePhoto = (key: string) => {
    setPhotos((prev) => prev.filter((p) => p.key !== key));
  };

  const submit = async () => {
    if (!type) {
      setError("Pick an assessment type");
      return;
    }
    if (!date) {
      setError("Pick a date");
      return;
    }
    if (tests.length === 0 && photos.length === 0) {
      setError("Add at least one test or photo");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const testInputs = tests.map((t) => ({
        id: t.id,
        testName: t.typeId,
        fields: Object.fromEntries(
          Object.entries(t.fields).map(([k, v]) => [k, Number(v) || v])
        ),
      }));
      const photoInputs = photos.map((p) => ({
        id: p.id,
        angle: p.angle,
        date,
        blob: p.file ?? p.existingBlob ?? null,
        photoUrl: p.existingUrl,
      }));
      if (assessmentId) {
        await updateAssessment.mutateAsync([
          assessmentId,
          { type, date, notes, tests: testInputs, photos: photoInputs },
        ]);
      } else {
        await createAssessment.mutateAsync({
          clientId,
          type,
          date,
          notes,
          tests: testInputs,
          photos: photoInputs,
        });
      }
      onSubmit?.();
    } catch (e) {
      setError(errMsg(e));
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Assessment type">
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Pick a type</option>
          {ASSESSMENT_TEST_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Date">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>

      <div className="flex flex-col gap-3">
        {tests.map((test) => {
          const def = ASSESSMENT_TEST_TYPES.find(
            (t) => t.id === test.typeId
          );
          if (!def) return null;
          return (
            <div
              key={test.key}
              className="rounded-2xl border border-line bg-surface p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium text-text">{def.label}</p>
                <button
                  onClick={() => removeTest(test.key)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-danger"
                  aria-label={`Remove ${def.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {def.fields.map((field) => (
                  <Field key={field.key} label={field.label}>
                    {field.input === "select" ? (
                      <Select
                        value={test.fields[field.key] ?? ""}
                        onChange={(e) =>
                          updateTest(test.key, {
                            fields: {
                              ...test.fields,
                              [field.key]: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="">Select</option>
                        {(field.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        type={field.input === "number" ? "number" : "text"}
                        inputMode={field.input === "number" ? "decimal" : undefined}
                        step={field.input === "number" ? "any" : undefined}
                        placeholder={field.unit}
                        value={test.fields[field.key] ?? ""}
                        onChange={(e) =>
                          updateTest(test.key, {
                            fields: {
                              ...test.fields,
                              [field.key]: e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </Field>
                ))}
              </div>
            </div>
          );
        })}

        {photos.map((photo) => (
          <div
            key={photo.key}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3"
          >
            <div className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2">
              {photo.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.preview}
                  alt="Client photo preview"
                  className="h-full w-full object-cover"
                />
              ) : photo.existingUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.existingUrl}
                  alt="Client photo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Camera className="h-5 w-5 text-muted" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Select
                value={photo.angle}
                onChange={(e) => updatePhoto(photo.key, { angle: e.target.value })}
              >
                {PHOTO_ANGLES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>
            <button
              onClick={() => removePhoto(photo.key)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:text-danger"
              aria-label="Remove photo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => addTest(type || ASSESSMENT_TEST_TYPES[0].id)}
          disabled={!type}
        >
          <Plus className="h-4 w-4" /> Add test
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Camera className="h-4 w-4" /> Add photo
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      <Field label="Notes (optional)">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything to remember about this assessment..."
        />
      </Field>

      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          onClick={() => void submit()}
          loading={busy}
          size="lg"
          className="flex-1"
        >
          {assessmentId ? "Save changes" : "Save assessment"}
        </Button>
      </div>
    </div>
  );
}

export function photoUrlFor(photo: ClientPhoto): string | null {
  if (photo.blob) return URL.createObjectURL(photo.blob);
  return photo.photoUrl;
}