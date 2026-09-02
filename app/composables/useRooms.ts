import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export interface RoomStatus {
  id: string;
  name: string;
  active: boolean;
  occupiedBy: {
    appointmentId: string;
    scheduledAt: string;
    patientName: string;
    internName: string;
  } | null;
}

/** Lista as salas com status (ocupada/disponível) — Administrativo. */
export function useRooms() {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => (await api.get<RoomStatus[]>('/rooms')).data,
  });
}

/** Realoca manualmente a sala de um agendamento, validando conflito no backend. */
export function useReassignRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, roomId }: { appointmentId: string; roomId: string }) =>
      api.patch('/rooms/reassign', { appointmentId, roomId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}
