import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

/** Datas "yyyy-mm-dd" (calendário local), inclusivas. */
export interface AttendancePeriod {
  startDate: string;
  endDate: string;
}

export interface SeriesResult {
  created: number;
  pairs: number;
  /** Vínculos sem nenhuma consulta: não há horário combinado para repetir. */
  pairsWithoutAnchor: number;
}

/** Período de atendimentos vigente (null se ainda não configurado) — Admin. */
export function useAttendancePeriod() {
  return useQuery({
    queryKey: ['attendance-period'],
    queryFn: async () => (await api.get<AttendancePeriod | null>('/settings/attendance-period')).data,
  });
}

/** Define início e fim dos atendimentos do ciclo. */
export function useSetAttendancePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: AttendancePeriod) => (await api.put<AttendancePeriod>('/settings/attendance-period', p)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['attendance-period'] }),
  });
}

/** Agenda as consultas semanais dos vínculos existentes até o fim do período (idempotente). */
export function useGenerateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post<SeriesResult>('/appointments/generate-series')).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
