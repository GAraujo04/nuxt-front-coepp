import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';
import type { Role } from '../shared/auth/types';

export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  crp: string | null;
  ra: string | null;
  phone: string | null;
  department: string | null;
  active: boolean;
}

export interface CreateUserPayload {
  role: 'INTERN' | 'SUPERVISOR';
  fullName: string;
  email: string;
  password: string;
  ra?: string;
  crp?: string;
  phone?: string;
  department?: string;
}

/** Lista usuários por papel (ex.: estagiários, supervisores). */
export function useUsersByRole(role: Role) {
  return useQuery({
    queryKey: ['users', role],
    queryFn: async () => (await api.get<AppUser[]>(`/users?role=${role}`)).data,
  });
}

/** Cadastra um usuário (aluno/estagiário ou supervisor) e revalida as listas. */
export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => (await api.post<AppUser>('/users', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export interface PendingSupervisorLink {
  id: string;
  fullName: string;
  email: string;
  pendingSupervisorName: string;
}

/** Alunos que se autocadastraram com "Outro" em vez de um supervisor cadastrado. */
export function usePendingSupervisors() {
  return useQuery({
    queryKey: ['users', 'pending-supervisors'],
    queryFn: async () => (await api.get<PendingSupervisorLink[]>('/users/pending-supervisors')).data,
  });
}

/** Vincula um aluno pendente a um supervisor cadastrado e revalida as listas. */
export function useLinkSupervisor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, supervisorId }: { id: string; supervisorId: string }) =>
      api.patch(`/users/${id}/link-supervisor`, { supervisorId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
