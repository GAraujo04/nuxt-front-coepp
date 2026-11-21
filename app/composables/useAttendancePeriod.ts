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

export interface SavedAttendancePeriod extends AttendancePeriod {
  /** O que salvar agendou nos pares que já existiam. */
  series: SeriesResult;
}

/**
 * Define início e fim dos atendimentos do ciclo. O backend já completa,
 * na mesma operação, a agenda semanal dos pares ativos até o novo fim
 * (idempotente — semanas já agendadas são puladas).
 */
export function useSetAttendancePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: AttendancePeriod) =>
      (await api.put<SavedAttendancePeriod>('/settings/attendance-period', p)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-period'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
