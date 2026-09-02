import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export interface AssignmentView {
  id: string;
  patientName: string;
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

/** Altera estagiário e/ou supervisor de um vínculo já existente. */
export function useUpdateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { id: string; internId?: string; supervisorId?: string }) =>
      api.patch(`/assignments/${v.id}`, { internId: v.internId, supervisorId: v.supervisorId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });
}
