"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Pencil, Trash2 } from "lucide-react";
import {
  AssessmentForm,
  photoUrlFor,
  type PhotoDraft,
  type TestDraft,
} from "@/components/AssessmentForm";
import { ConfirmDialog } from "@/components/overlays";
import {
  Badge,
  Card,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { getTestTypeDef, getTestTypeLabel } from "@/lib/assessments-config";
import { useAssessment, useClient, useDeleteAssessment } from "@/lib/hooks";
import { fmtDate } from "@/lib/utils";

export default function AssessmentDetailPage() {
  const params = useParams<{ id: string; assessmentId: string }>();
  const router = useRouter();
  const { data: detail, isLoading, isError, refetch } = useAssessment(
    params.assessmentId
  );
  const { data: client } = useClient(params.id);
  const deleteAssessment = useDeleteAssessment();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="pt-4">
        <PageHeader title="Assessment" backHref={`/clients/${params.id}`} />
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      </div>
    );
  }

  if (isError || !detail) {
    return (
      <div className="pt-4">
        <PageHeader title="Assessment" backHref={`/clients/${params.id}`} />
        <ErrorState message="Assessment not found." onRetry={() => void refetch()} />
      </div>
    );
  }

  const onDelete = async () => {
    await deleteAssessment.mutateAsync(detail.assessment.id);
    router.push(`/clients/${params.id}`);
  };

  const initialTests: TestDraft[] = detail.tests.map((t) => ({
    key: t.id,
    id: t.id,
    typeId: t.testName,
    fields: Object.fromEntries(
      Object.entries(t.fields).map(([k, v]) => [k, String(v)])
    ),
  }));

  const initialPhotos: PhotoDraft[] = detail.photos.map((p) => ({
    key: p.id,
    id: p.id,
    angle: p.angle,
    file: null,
    preview: null,
    existingUrl: photoUrlFor(p),
    existingBlob: p.blob,
  }));

  return (
    <div className="pt-4">
      <PageHeader
        title={getTestTypeLabel(detail.assessment.type)}
        subtitle={`${client?.fullName ?? ""} · ${fmtDate(detail.assessment.date)}`}
        backHref={`/clients/${params.id}`}
        actions={
          editing ? (
            <button
              onClick={() => setEditing(false)}
              className="flex h-9 items-center rounded-xl border border-line bg-surface px-3 text-sm text-muted hover:text-text"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-text"
                aria-label="Edit assessment"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-danger"
                aria-label="Delete assessment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )
        }
      />

      {editing ? (
        <AssessmentForm
          clientId={params.id}
          assessmentId={detail.assessment.id}
          initialTests={initialTests}
          initialPhotos={initialPhotos}
          initialType={detail.assessment.type}
          initialDate={detail.assessment.date}
          initialNotes={detail.assessment.notes ?? ""}
          onCancel={() => setEditing(false)}
          onSubmit={() => setEditing(false)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {detail.assessment.notes && (
            <Card className="p-4">
              <p className="text-[13px] text-muted">{detail.assessment.notes}</p>
            </Card>
          )}

          {detail.tests.map((test) => {
            const def = getTestTypeDef(test.testName);
            if (!def) return null;
            return (
              <Card key={test.id} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-medium text-text">{def.label}</p>
                  <Badge>{fmtDate(detail.assessment.date)}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {def.fields.map((field) => {
                    const raw = test.fields[field.key];
                    if (raw === undefined || raw === null || raw === "") return null;
                    return (
                      <div
                        key={field.key}
                        className="rounded-lg bg-surface-2 px-3 py-2"
                      >
                        <p className="text-[11px] uppercase tracking-wide text-muted">
                          {field.label}
                        </p>
                        <p className="text-[15px] font-semibold text-text tabular-nums">
                          {String(raw)}
                          {field.unit ? ` ${field.unit}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {detail.photos.length > 0 && (
            <Card className="p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-muted">
                <Camera className="h-4 w-4" /> Photos
              </p>
              <div className="grid grid-cols-3 gap-2">
                {detail.photos.map((photo) => {
                  const src = photoUrlFor(photo);
                  if (!src) return null;
                  return (
                    <figure key={photo.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${photo.angle} photo`}
                        className="aspect-[3/4] w-full rounded-lg object-cover"
                      />
                      <figcaption className="mt-1 text-center text-[11px] text-muted">
                        {photo.angle}
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete assessment?"
        message="The assessment is hidden from history. Nothing is permanently erased."
        confirmLabel="Delete"
        busy={deleteAssessment.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}