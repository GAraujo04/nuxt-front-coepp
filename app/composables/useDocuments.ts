import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

// Porta documents/api/use-documents.ts inteiro (será reusado por ReviewQueue
// e ReviewDocument nas próximas páginas dessa slice).
export type DocAction = 'SUBMIT' | 'TAKE' | 'REQUEST_CHANGES' | 'REJECT' | 'APPROVE' | 'REOPEN';

export interface QueueItem {
  id: string;
  numero: string | null;
  type: string;
  status: string;
  authorName: string;
  /** null para o supervisor (o nome ele lê na ficha de triagem). */
  patientName: string | null;
  /** Código do paciente — é o "Nº" exibido nos documentos. */
  patientCode: string;
  updatedAt: string;
}

// Não exportado (diferente de useScreenings.ts) — usado só internamente por
// ReviewDoc aqui embaixo. Exportar os dois com o mesmo nome colidiria no
// auto-import global do Nuxt (o composables/useScreenings.ts já exporta um
// Signature próprio) — problema que não existe no React, onde cada arquivo
// importa explicitamente o que usa.
interface Signature {
  signerName: string;
  signerRole: string;
  signerRef: string | null;
  provider: string;
  signedAt: string;
}

export interface ReviewDoc extends QueueItem {
  content: Record<string, unknown>;
  comments: { id: string; body: string; reviewerName: string; createdAt: string }[];
  signatures: Signature[];
}

/** Fila de revisão do supervisor. */
export function useReviewQueue() {
  return useQuery({
    queryKey: ['review-queue'],
    queryFn: async () => (await api.get<QueueItem[]>('/documents/review-queue')).data,
  });
}

export interface ReportItem extends QueueItem {
  authorId: string;
  /** Chegada ao supervisor: o último envio do estagiário. */
  submittedAt: string;
}

/** Documentos já enviados (não rascunho), em ordem de chegada — Supervisor (seus pacientes) / Admin. */
export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => (await api.get<ReportItem[]>('/documents/reports')).data,
  });
}

/** Documento aberto para revisão. */
export function useReviewDoc(id: MaybeRefOrGetter<string | undefined>) {
  return useQuery({
    queryKey: ['review-doc', id],
    enabled: () => !!toValue(id),
    queryFn: async () => (await api.get<ReviewDoc>(`/documents/${toValue(id)}/review`)).data,
  });
}

/** Executa uma transição na máquina de estados do documento. */
export function useTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; action: DocAction; comment?: string }) =>
      (
        await api.post<{ id: string; status: string }>(`/documents/${v.id}/transitions`, {
          action: v.action,
          comment: v.comment,
        })
      ).data,
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['screening', v.id] });
      qc.invalidateQueries({ queryKey: ['screenings'] });
      qc.invalidateQueries({ queryKey: ['review-queue'] });
      qc.invalidateQueries({ queryKey: ['review-doc', v.id] });
      qc.invalidateQueries({ queryKey: ['reports'] });
    },
  });
}
