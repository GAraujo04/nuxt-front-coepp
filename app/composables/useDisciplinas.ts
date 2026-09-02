import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export interface Disciplina {
  id: string;
  name: string;
  active: boolean;
}

export function useDisciplinas() {
  return useQuery({
    queryKey: ['disciplinas'],
    queryFn: async () => (await api.get<Disciplina[]>('/disciplinas')).data,
  });
}

export function useCreateDisciplina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => (await api.post<Disciplina>('/disciplinas', { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disciplinas'] }),
  });
}
