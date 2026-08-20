"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createClient,
  softDeleteClient,
  updateClient,
  type ClientInput,
} from "@/lib/repos/clients";
import {
  createExercise,
  softDeleteExercise,
  updateExercise,
  type ExerciseInput,
} from "@/lib/repos/exercises";
import {
  copySession,
  createSession,
  getPreviousPerformance,
  getSessionDetail,
  getStrengthSeries,
  listSessions,
  listSessionsForClient,
  softDeleteSession,
  updateSession,
  type SessionInput,
  type UpdateSessionInput,
} from "@/lib/repos/sessions";
import {
  createAssessment,
  getAssessmentDetail,
  getWeightSeries,
  listAssessmentsForClient,
  softDeleteAssessment,
  updateAssessment,
  type AssessmentInput,
} from "@/lib/repos/assessments";
import { listClients, getClient } from "@/lib/repos/clients";
import { listExercises } from "@/lib/repos/exercises";
import { requestSync } from "@/lib/sync/trigger";
import type { Client, Exercise, Id } from "@/lib/db/schema";

export const qk = {
  clients: ["clients"] as const,
  client: (id: Id) => ["clients", id] as const,
  sessions: ["sessions"] as const,
  session: (id: Id) => ["sessions", id] as const,
  clientSessions: (clientId: Id) => ["sessions", "by-client", clientId] as const,
  exercises: ["exercises"] as const,
  assessments: (clientId: Id) => ["assessments", clientId] as const,
  assessment: (id: Id) => ["assessments", "one", id] as const,
  prevPerformance: (clientId: Id, exerciseId: Id, before: string) =>
    ["prev-performance", clientId, exerciseId, before] as const,
  weightSeries: (clientId: Id) => ["weight-series", clientId] as const,
  strengthSeries: (clientId: Id, exerciseId: Id) =>
    ["strength-series", clientId, exerciseId] as const,
};

function invalidateQueries(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["clients"] });
  void client.invalidateQueries({ queryKey: ["sessions"] });
  void client.invalidateQueries({ queryKey: ["exercises"] });
  void client.invalidateQueries({ queryKey: ["assessments"] });
  void client.invalidateQueries({ queryKey: ["prev-performance"] });
  void client.invalidateQueries({ queryKey: ["weight-series"] });
  void client.invalidateQueries({ queryKey: ["strength-series"] });
}

function useDataMutation<TVariables, TResult>(
  fn: (variables: TVariables) => Promise<TResult>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => fn(variables),
    onSuccess: () => {
      requestSync();
      invalidateQueries(queryClient);
    },
  });
}

export function useClients() {
  return useQuery({
    queryKey: qk.clients,
    queryFn: () => listClients(),
  });
}

export function useClient(id: Id | undefined) {
  return useQuery({
    queryKey: qk.client(id ?? ""),
    queryFn: () => getClient(id!),
    enabled: Boolean(id),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: qk.sessions,
    queryFn: () => listSessions(),
  });
}

export function useClientSessions(clientId: Id) {
  return useQuery({
    queryKey: qk.clientSessions(clientId),
    queryFn: () => listSessionsForClient(clientId),
  });
}

export function useSessionDetail(id: Id | undefined) {
  return useQuery({
    queryKey: qk.session(id ?? ""),
    queryFn: () => getSessionDetail(id!),
    enabled: Boolean(id),
  });
}

export function useExercises() {
  return useQuery({
    queryKey: qk.exercises,
    queryFn: () => listExercises(),
  });
}

export function useAssessments(clientId: Id) {
  return useQuery({
    queryKey: qk.assessments(clientId),
    queryFn: () => listAssessmentsForClient(clientId),
  });
}

export function useAssessment(id: Id | undefined) {
  return useQuery({
    queryKey: qk.assessment(id ?? ""),
    queryFn: () => getAssessmentDetail(id!),
    enabled: Boolean(id),
  });
}

export function usePreviousPerformance(
  clientId: Id,
  exerciseId: Id,
  beforeDate: string
) {
  return useQuery({
    queryKey: qk.prevPerformance(clientId, exerciseId, beforeDate),
    queryFn: () => getPreviousPerformance(clientId, exerciseId, beforeDate),
  });
}

export function useWeightSeries(clientId: Id) {
  return useQuery({
    queryKey: qk.weightSeries(clientId),
    queryFn: () => getWeightSeries(clientId),
  });
}

export function useStrengthSeries(clientId: Id, exerciseId: Id | null) {
  return useQuery({
    queryKey: qk.strengthSeries(clientId, exerciseId ?? ""),
    queryFn: () => getStrengthSeries(clientId, exerciseId!),
    enabled: Boolean(exerciseId),
  });
}

export function useCreateClient() {
  return useDataMutation((input: ClientInput) => createClient(input));
}

export function useUpdateClient() {
  return useDataMutation<[Id, Partial<ClientInput>], Client>((args) =>
    updateClient(args[0], args[1])
  );
}

export function useDeleteClient() {
  return useDataMutation<Id, void>((id) => softDeleteClient(id));
}

export function useCreateSession() {
  return useDataMutation<SessionInput, string>((input) => createSession(input));
}

export function useUpdateSession() {
  return useDataMutation<[Id, UpdateSessionInput], void>((args) =>
    updateSession(args[0], args[1])
  );
}

export function useCopySession() {
  return useDataMutation<[Id, string | undefined], string>((args) =>
    copySession(args[0], args[1])
  );
}

export function useDeleteSession() {
  return useDataMutation<Id, void>((id) => softDeleteSession(id));
}

export function useCreateExercise() {
  return useDataMutation<ExerciseInput, Exercise>((input) =>
    createExercise(input)
  );
}

export function useUpdateExercise() {
  return useDataMutation<[Id, Partial<ExerciseInput>], Exercise>((args) =>
    updateExercise(args[0], args[1])
  );
}

export function useDeleteExercise() {
  return useDataMutation<Id, void>((id) => softDeleteExercise(id));
}

export function useCreateAssessment() {
  return useDataMutation<AssessmentInput, string>((input) =>
    createAssessment(input)
  );
}

export function useUpdateAssessment() {
  return useDataMutation<[Id, Omit<AssessmentInput, "clientId">], void>(
    (args) => updateAssessment(args[0], args[1])
  );
}

export function useDeleteAssessment() {
  return useDataMutation<Id, void>((id) => softDeleteAssessment(id));
}