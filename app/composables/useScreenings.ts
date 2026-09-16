import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

/**
 * Tipo de documento clínico. Espelha o Literal `ScreeningType` do backend
 * (screening/domain/screening_content.py) — os dois têm de andar juntos.
 *
 * O nome "Screening" é herança de quando só existiam as duas triagens: hoje
 * o mesmo slice carrega os cinco documentos de estágio, porque o
 * ClinicalDocument.type é string livre e todo o fluxo (auto-save, envio à
 * supervisão, máquina de estados) já é agnóstico ao tipo.
 */
export type ScreeningType =
  | 'SCREENING_ADULT'
  | 'SCREENING_CHILD'
  | 'EVOLUTION'
  | 'PSYCH_ASSESSMENT'
  | 'WEEKLY_REPORT'
  | 'PARTIAL_REPORT'
  | 'FINAL_REPORT'
  | 'PSYCH_REPORT';

export interface Signature {
  signerName: string;
  signerRole: string;
  signerRef: string | null;
  provider: string;
  signedAt: string;
}

export interface Screening {
  id: string;
  numero: string | null;
  type: ScreeningType;
  status: string;
  version: number;
  patientId: string;
  authorId: string;
  coAuthorIds: string[];
  content: Record<string, unknown>;
  signatures: Signature[];
  createdAt: string;
  updatedAt: string;
}

/** Lista as triagens visíveis ao usuário (escopo por RLS no backend). */
export function useScreenings() {
  return useQuery({
    queryKey: ['screenings'],
    queryFn: async () => (await api.get<Screening[]>('/screenings')).data,
  });
}

/** Carrega uma triagem específica. */
export function useScreening(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryKey: ['screening', id],
    enabled: () => !!toValue(id),
    queryFn: async () => (await api.get<Screening>(`/screenings/${toValue(id)}`)).data,
  });
}

/** Cria uma triagem (rascunho). */
export function useCreateScreening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { type: ScreeningType; patientId: string; content?: Record<string, unknown> }) =>
      (await api.post<Screening>('/screenings', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screenings'] }),
  });
}

/** Salva o rascunho (auto-save) com concorrência otimista. */
export function useSaveScreeningDraft() {
  return useMutation({
    mutationFn: async (input: { id: string; content: Record<string, unknown>; expectedVersion: number }) =>
      (
        await api.patch<Screening>(`/screenings/${input.id}`, {
          content: input.content,
          expectedVersion: input.expectedVersion,
        })
      ).data,
  });
}

