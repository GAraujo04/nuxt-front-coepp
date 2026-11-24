import { useQuery } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

// Porta features/portal/api/use-portal.ts. Nome deliberadamente distinto de
// app/pages/portal.vue (o hub público de login) — mesma distinção do React
// entre o slice "entry-portal" e o slice "portal" (painel autenticado do
// paciente).
export interface PortalData {
  code: string;
  fullName: string;
  appointments: { scheduledAt: string; status: string; internName: string; roomName: string | null }[];
  pendingSlots: string[];
}

/** Dados do portal do paciente (suas consultas + horários pendentes de pareamento). */
export function usePortal() {
  return useQuery({
    queryKey: ['portal'],
    queryFn: async () => (await api.get<PortalData>('/portal/me')).data,
  });
}
