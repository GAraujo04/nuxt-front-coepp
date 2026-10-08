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
  /** Código do paciente — é como o estagiário o identifica nas listas. */
  patientCode: string | null;
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

function invalidateAgenda(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['agenda'] });
  qc.invalidateQueries({ queryKey: ['matches'] });
  qc.invalidateQueries({ queryKey: ['rooms'] });
}

/** Cancela a consulta; com `following`, também as seguintes do mesmo par (Admin). */
export function useCancelAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; following: boolean }) =>
      (await api.patch<{ cancelled: number }>(`/appointments/${v.id}/cancel`, { following: v.following })).data,
    onSuccess: () => invalidateAgenda(qc),
  });
}

/** Remarca data/hora (ISO) e sala de uma consulta (Admin). 409 se a sala estiver ocupada. */
export function useRescheduleAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; scheduledAt: string; roomId: string | null }) =>
      (await api.patch<Appointment>(`/appointments/${v.id}/reschedule`, { scheduledAt: v.scheduledAt, roomId: v.roomId }))
        .data,
    onSuccess: () => invalidateAgenda(qc),
  });
}
