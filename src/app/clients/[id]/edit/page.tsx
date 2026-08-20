"use client";

import { ClientForm } from "@/components/ClientForm";
import { PageHeader, Spinner } from "@/components/ui";
import { useClient } from "@/lib/hooks";
import { useParams } from "next/navigation";

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(params.id);

  return (
    <div className="pt-4">
      <PageHeader title="Edit client" backHref={`/clients/${params.id}`} />
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : client ? (
        <ClientForm client={client} />
      ) : (
        <p className="text-sm text-danger">Client not found.</p>
      )}
    </div>
  );
}