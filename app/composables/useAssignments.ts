import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export interface AssignmentView {
  id: string;
  /** Só o código: a tela de vínculos não identifica o paciente pelo nome. */
  patientCode: string;
  internId: string;
  internName: string;
  supervisorId: string | null;
  supervisorName: string | null;
  active: boolean;
}

/** Lista os vínculos (Admin). */
export function useAssignments() {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => (await api.get<AssignmentView[]>('/assignments')).data,
  });
}

/**
 * Altera estagiário e/ou supervisor de um vínculo, ou o encerra
 * (`active: false`). A agenda acompanha: trocar o estagiário transfere as
 * consultas futuras; encerrar as cancela.
 */
export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; internId?: string; supervisorId?: string; active?: false }) =>
      api.patch(`/assignments/${v.id}`, { internId: v.internId, supervisorId: v.supervisorId, active: v.active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
}
