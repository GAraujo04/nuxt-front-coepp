import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export type NotificationKind =
  | 'REVIEW_QUEUE'
  | 'AVAILABILITY_REQUESTS'
  | 'PENDING_MATCHES'
  | 'ASSIGNMENTS_WITHOUT_SUPERVISOR'
  | 'CHANGES_REQUESTED'
  | 'AVAILABILITY_UNLOCKED'
  | 'DOCUMENT_APPROVED'
  | 'DOCUMENT_REJECTED';

export interface AppNotification {
  kind: NotificationKind;
  /** Pendência (algo a fazer) — some quando resolvida. Senão, informativo. */
  actionable: boolean;
  at: string | null;
  count: number;
  documentId: string | null;
  docType: string | null;
  patientCode: string | null;
  until: string | null;
  unseen: boolean;
}

export interface NotificationsPayload {
  unread: number;
  items: AppNotification[];
}

/**
 * Avisos do usuário logado (o sininho). Sem e-mail nem push: a lista é
 * recalculada pelo backend a cada consulta, então o sininho se atualiza
 * sozinho a cada minuto e ao voltar para a aba.
 */
export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<NotificationsPayload>('/notifications')).data,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

/** Abriu a lista: informativos deixam de contar no sininho. */
export function useMarkNotificationsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/seen');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
