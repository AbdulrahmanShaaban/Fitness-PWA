"use client";

import { useParams, useRouter } from "next/navigation";
import { AssessmentForm } from "@/components/AssessmentForm";
import { PageHeader, Spinner } from "@/components/ui";
import { useClient } from "@/lib/hooks";

export default function NewAssessmentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: client, isLoading } = useClient(params.id);

  return (
    <div className="pt-4">
      <PageHeader
        title="New assessment"
        subtitle={client?.fullName}
        backHref={`/clients/${params.id}`}
      />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : client ? (
        <AssessmentForm
          clientId={client.id}
          onSubmit={() => router.push(`/clients/${client.id}`)}
        />
      ) : (
        <p className="text-sm text-danger">Client not found.</p>
      )}
    </div>
  );
}