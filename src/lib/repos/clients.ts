import { db } from "@/lib/db/db";
import {
  newBaseRow,
  withUpdatedAt,
  type Client,
} from "@/lib/db/schema";

const EGYPTIAN_PHONE = /^01[0125]\d{8}$/;

export type { Client } from "@/lib/db/schema";

export function validatePhone(phone: string | null | undefined): string | null {
  if (!phone || phone.trim() === "") return null;
  return EGYPTIAN_PHONE.test(phone.trim())
    ? null
    : "Phone must be 11 digits starting with 010, 011, 012 or 015";
}

export interface ClientInput {
  fullName: string;
  phone: string | null;
  startDate: string;
  notes: string | null;
}

export async function createClient(input: ClientInput): Promise<Client> {
  const row: Client = {
    ...newBaseRow(),
    fullName: input.fullName.trim(),
    phone: input.phone?.trim() || null,
    startDate: input.startDate,
    notes: input.notes?.trim() || null,
  };
  await db.clients.add(row);
  return row;
}

export async function updateClient(
  id: string,
  input: Partial<ClientInput>
): Promise<Client> {
  const existing = await db.clients.get(id);
  if (!existing) throw new Error("Client not found");
  const next: Client = withUpdatedAt({
    ...existing,
    ...(input.fullName !== undefined
      ? { fullName: input.fullName.trim() }
      : {}),
    ...(input.phone !== undefined
      ? { phone: input.phone?.trim() || null }
      : {}),
    ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
    ...(input.notes !== undefined
      ? { notes: input.notes?.trim() || null }
      : {}),
  });
  await db.clients.put(next);
  return next;
}

export async function softDeleteClient(id: string): Promise<void> {
  const existing = await db.clients.get(id);
  if (!existing) throw new Error("Client not found");
  await db.clients.put(withUpdatedAt({ ...existing, isDeleted: true }));
}

export async function listClients(): Promise<Client[]> {
  return db.clients.filter((c) => !c.isDeleted).sortBy("createdAt");
}

export async function getClient(id: string): Promise<Client | undefined> {
  return db.clients.get(id);
}

export function clientInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatPhone(phone: string | null): string {
  if (!phone) return "No phone";
  return phone.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1 $2 $3");
}