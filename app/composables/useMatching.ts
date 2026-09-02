import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

// Porta matching/api/use-matching.ts inteiro — MatchesList usa só
// useMatches/useRunMatching agora; o restante (useSuggestions,
// usePendingMatchRequests, useResolvePendingMatchRequest,
// useCreateManualMatch) é usado por PendingMatchAlerts e ManualMatchPanel,
// que entram junto com a slice admin.
export interface MatchView {
  appointmentId: string;
  scheduledAt: string;
  status: string;
  internName: string;
  patientName: string;
  roomName: string | null;
}

/** Lista as consultas/pareamentos (Admin e Supervisor). */
export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => (await api.get<MatchView[]>('/matching/matches')).data,
  });
}

/** Executa o pareamento por disponibilidade (Admin). */
export function useRunMatching() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<{ matched: number }>('/matching/run')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export interface MatchSuggestion {
  patientId: string;
  patientName: string;
  internId: string;
  internName: string;
  roomId: string;
  roomName: string;
  scheduledAt: string;
}

/** Pares que o pareamento automático formaria nesta rodada, sem persistir (Admin). */
export function useSuggestions() {
  return useQuery({
    queryKey: ['match-suggestions'],
    queryFn: async () => (await api.get<MatchSuggestion[]>('/matching/suggestions')).data,
  });
}

export interface PendingMatchRequestView {
  id: string;
  patientName: string;
  suggestedInternName: string | null;
  suggestedAt: string | null;
  status: string;
  createdAt: string;
}

/** Alertas de fallback por aproximação — pacientes sem match exato na última rodada (Admin). */
export function usePendingMatchRequests() {
  return useQuery({
    queryKey: ['pending-match-requests'],
    queryFn: async () => (await api.get<PendingMatchRequestView[]>('/matching/pending-requests')).data,
  });
}

/** Marca o alerta como resolvido — equipe já entrou em contato com o paciente (Admin). */
export function useResolvePendingMatchRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.patch(`/matching/pending-requests/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pending-match-requests'] }),
  });
}

export interface ManualMatchWarning {
  code: string;
  message: string;
}
export interface ManualMatchPayload {
  patientId: string;
  internId: string;
  scheduledAt: string; // ISO
  roomId?: string;
  acknowledgeWarnings?: boolean;
}
export interface ManualMatchResult {
  appointmentId: string;
  warnings: ManualMatchWarning[];
}

/** Cria um match manual, sobrepondo a sugestão automática (Admin). */
export function useCreateManualMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ManualMatchPayload) => (await api.post<ManualMatchResult>('/matching/manual', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['match-suggestions'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
