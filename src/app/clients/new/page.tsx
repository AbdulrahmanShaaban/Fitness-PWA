"use client";

import { ClientForm } from "@/components/ClientForm";
import { PageHeader } from "@/components/ui";

export default function NewClientPage() {
  return (
    <div className="pt-4">
      <PageHeader title="Add client" subtitle="Basic details to get started" backHref="/" />
      <ClientForm />
    </div>
  );
}