import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

// Pareamento. Admin: propostas (MatchProposals — rodar, salvar, cancelar),
// quem ficou sem par (UnmatchedPanel) e match manual (ManualMatchPanel).
// Supervisor: consultas dos pares, só leitura (MatchesList).
export interface MatchView {
  appointmentId: string;
  scheduledAt: string;
  status: string;
  /** Com patientCode, identifica o par (a lista agrupa a série semanal por ele). */
  internId: string;
  internName: string;
  /** null para o supervisor — usar patientCode. */
  patientName: string | null;
  patientCode: string;
  roomName: string | null;
}

/** Lista as consultas dos pares (Supervisor; o backend também serve ao Admin). */
export function useMatches() {
  return useQuery({
    queryKey: ['matches'],
    queryFn: async () => (await api.get<MatchView[]>('/matching/matches')).data,
  });
}

/**
 * Executa o pareamento por disponibilidade (Admin). Não cria vínculo:
 * grava propostas, que o admin salva ou cancela. `matched` = propostas novas.
 */
export function useRunMatching() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<{ matched: number }>('/matching/run')).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match-proposals'] });
      qc.invalidateQueries({ queryKey: ['match-suggestions'] });
      qc.invalidateQueries({ queryKey: ['unmatched'] });
    },
  });
}

export interface MatchProposal {
  id: string;
  patientId: string;
  patientCode: string;
  internId: string;
  internName: string;
  roomId: string | null;
  roomName: string | null;
  /** Primeira consulta; o par segue nesse dia e horário até o fim do período. */
  scheduledAt: string;
}

/** Propostas do pareamento aguardando salvar ou cancelar (Admin). */
export function useMatchProposals() {
  return useQuery({
    queryKey: ['match-proposals'],
    queryFn: async () => (await api.get<MatchProposal[]>('/matching/proposals')).data,
  });
}

/** Salva a proposta (com o horário/sala do card): cria o vínculo e a agenda do período. */
export function useConfirmProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; scheduledAt: string; roomId: string | null }) =>
      (
        await api.post<{ appointmentId: string }>(`/matching/proposals/${v.id}/confirm`, {
          scheduledAt: v.scheduledAt,
          roomId: v.roomId,
        })
      ).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match-proposals'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}

/** Cancela a proposta sem salvar: some do pareamento, sem vínculo nem consulta. */
export function useDiscardProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/matching/proposals/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['match-proposals'] });
      qc.invalidateQueries({ queryKey: ['match-suggestions'] });
      qc.invalidateQueries({ queryKey: ['unmatched'] });
    },
  });
}

export interface MatchSuggestion {
  patientId: string;
  patientCode: string;
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

export interface AvailabilityWindow {
  weekday: number; // 0=domingo .. 6=sábado
  startTime: string;
  endTime: string;
}
export interface UnmatchedPatient {
  id: string;
  code: string;
  isMinor: boolean;
  hasDisability: boolean;
  windows: AvailabilityWindow[];
  registeredAt: string;
  /** Desde quando o pareamento não acha horário compatível; null = ainda não passou por uma rodada. */
  noMatchSince: string | null;
}
export interface UnmatchedIntern {
  id: string;
  name: string;
  ra: string | null;
  windows: AvailabilityWindow[];
}

/** Pacientes e estagiários sem par, com a disponibilidade — para o pareamento manual (Admin). */
export function useUnmatched() {
  return useQuery({
    queryKey: ['unmatched'],
    queryFn: async () =>
      (await api.get<{ patients: UnmatchedPatient[]; interns: UnmatchedIntern[] }>('/matching/unmatched')).data,
  });
}

/**
 * Quem o admin escolheu na lista de "sem par" para o match manual: o
 * painel do match manual lê e preenche o formulário.
 */
export function useManualMatchPick() {
  return useState<{ patientId?: string; internId?: string }>('manual-match-pick', () => ({}));
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
      qc.invalidateQueries({ queryKey: ['unmatched'] });
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
