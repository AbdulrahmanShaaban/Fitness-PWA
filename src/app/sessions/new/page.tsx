"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SessionForm } from "@/components/SessionForm";
import { PageHeader, Spinner } from "@/components/ui";

export default function NewSessionPage() {
  return (
    <div className="pt-4">
      <PageHeader
        title="New session"
        subtitle="Log today's training"
        backHref="/sessions"
      />
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        }
      >
        <NewSessionForm />
      </Suspense>
    </div>
  );
}

function NewSessionForm() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId") ?? undefined;
  return <SessionForm initialClientId={clientId} />;
}