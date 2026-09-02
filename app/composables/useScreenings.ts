import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export type ScreeningType = 'SCREENING_ADULT' | 'SCREENING_CHILD';

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
    mutationFn: async (input: { type: ScreeningType; patientId: string }) =>
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

/** Remove um documento — só RASCUNHO do próprio autor/coautor (backend valida; RLS é o backstop). */
export function useDeleteScreening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/screenings/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['screenings'] }),
  });
}
