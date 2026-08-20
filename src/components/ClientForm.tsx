"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  validatePhone,
  type Client,
} from "@/lib/repos/clients";
import { useCreateClient, useUpdateClient } from "@/lib/hooks";
import { todayIso } from "@/lib/utils";
import { PhoneInput } from "./PhoneInput";
import { Button, Field, Input, Textarea } from "./ui";

export function ClientForm({
  client,
  onDone,
}: {
  client?: Client;
  onDone?: () => void;
}) {
  const router = useRouter();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const [fullName, setFullName] = useState(client?.fullName ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [startDate, setStartDate] = useState(client?.startDate ?? todayIso());
  const [notes, setNotes] = useState(client?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const busy = createClient.isPending || updateClient.isPending;

  const submit = async () => {
    if (!fullName.trim()) {
      setError("Name is required");
      return;
    }
    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }
    setError(null);
    try {
      if (client) {
        await updateClient.mutateAsync([
          client.id,
          { fullName, phone, startDate, notes },
        ]);
      } else {
        await createClient.mutateAsync({
          fullName,
          phone,
          startDate,
          notes,
        });
      }
      if (onDone) onDone();
      else router.push("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save client");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Full name">
        <Input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Ahmed Hassan"
          autoFocus
        />
      </Field>
      <Field
        label="Phone (optional)"
        hint="Egyptian mobile format, e.g. 01012345678"
      >
        <PhoneInput value={phone} onChange={setPhone} />
      </Field>
      <Field label="Start date" hint="Future dates are allowed">
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </Field>
      <Field label="Notes (optional)">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Goals, injuries, plan details..."
        />
      </Field>
      {error && (
        <p className="rounded-xl border border-danger/25 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}
      <Button onClick={() => void submit()} loading={busy} size="lg">
        {client ? "Save changes" : "Add client"}
      </Button>
    </div>
  );
}