import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

// Porta appointments/api/{types,use-agenda}.ts — tipo + hooks num arquivo só,
// mesma convenção já usada em useEnrollment.ts.
export type AppointmentStatus = 'SCHEDULED' | 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';

export interface Appointment {
  id: string;
  patientId: string;
  internId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes: string | null;
  roomId: string | null;
  roomName: string | null;
}

/** Busca a agenda visível ao usuário (o escopo por vínculo é imposto pela RLS no backend). */
export function useAgenda() {
  return useQuery({
    queryKey: ['agenda'],
    queryFn: async () => (await api.get<Appointment[]>('/appointments')).data,
  });
}

/** Registra presença/falta e revalida a agenda. */
export function useRegisterAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; outcome: 'ATTENDED' | 'NO_SHOW' }) =>
      (await api.patch<Appointment>(`/appointments/${vars.id}/attendance`, { outcome: vars.outcome })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agenda'] }),
  });
}
