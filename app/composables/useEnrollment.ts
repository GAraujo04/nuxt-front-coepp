import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

// Porta features/enrollment/api/use-enrollment.ts inteiro (tipos + hooks) —
// é usado por 4 telas (CompleteInternProfile, EditAvailabilityPage,
// PatientSelfRegister, StudentSelfRegister), então faz sentido migrar tudo
// de uma vez, como no React.

export interface RegOptions {
  supervisors: { id: string; fullName: string }[];
  disciplinas: { id: string; name: string }[];
}

/** Opções públicas do autocadastro de aluno: supervisores e disciplinas. */
export function useRegistrationOptions() {
  return useQuery({
    queryKey: ['reg-options'],
    queryFn: async () => (await api.get<RegOptions>('/register/options')).data,
  });
}

export interface AvailabilityWindowPayload {
  weekday: number; // 0=domingo .. 6=sábado
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface PatientSelfReg {
  fullName: string;
  email: string;
  cpf: string;
  birthDate: string;
  phone?: string;
  guardian?: { name: string; cpf?: string; relationship?: string; phone?: string };
  windows: AvailabilityWindowPayload[];
  hasDisability?: boolean;
  disabilityTypes?: string[];
  disabilityOtherText?: string;
}

export interface StudentSelfReg {
  fullName: string;
  email: string;
  ra: string;
  password: string;
  phone?: string;
  // Exatamente um dos dois: supervisor já cadastrado, ou nome livre (opção "Outro").
  academicSupervisorId?: string;
  pendingSupervisorName?: string;
  disciplinaId: string;
  periodo?: string;
  turma?: string;
  windows: AvailabilityWindowPayload[];
  acceptedTermVersion: string;
}

export interface ResponsibilityTerm {
  version: string;
  content: string;
}

/** Termo de responsabilidade vigente (versão + texto), exibido no cadastro do aluno. */
export function useResponsibilityTerm() {
  return useQuery({
    queryKey: ['responsibility-term'],
    queryFn: async () => (await api.get<ResponsibilityTerm>('/register/responsibility-term')).data,
  });
}

/** Autocadastro público de paciente. */
export function useRegisterPatient() {
  return useMutation({
    mutationFn: async (data: PatientSelfReg) => (await api.post<{ id: string; code: string }>('/register/patient', data)).data,
  });
}

/** Autocadastro público de aluno/estagiário. */
export function useRegisterStudent() {
  return useMutation({
    mutationFn: async (data: StudentSelfReg) => (await api.post<{ id: string }>('/register/student', data)).data,
  });
}

export interface CompleteInternProfilePayload {
  // Exatamente um dos dois: supervisor já cadastrado, ou nome livre (opção "Outro").
  academicSupervisorId?: string;
  pendingSupervisorName?: string;
  disciplinaId: string;
  periodo?: string;
  turma?: string;
  windows: AvailabilityWindowPayload[];
  acceptedTermVersion: string;
  // Opcionais — conta auto-provisionada via TOTVS não tem nenhum dos três ainda.
  ra?: string;
  phone?: string;
  email?: string;
}

/** Completa o cadastro do estagiário já autenticado (1º acesso via TOTVS, ou enquanto o perfil estiver incompleto). */
export function useCompleteInternProfile() {
  return useMutation({
    mutationFn: async (data: CompleteInternProfilePayload) => {
      await api.patch('/enrollment/complete-profile', data);
    },
  });
}

/** Disponibilidade recorrente atual do estagiário logado (pra pré-preencher a tela de edição). */
export function useMyAvailabilityWindows() {
  return useQuery({
    queryKey: ['my-availability-windows'],
    queryFn: async () => (await api.get<AvailabilityWindowPayload[]>('/enrollment/availability-windows')).data,
  });
}

/**
 * Substitui a disponibilidade recorrente do estagiário logado. Só passa com
 * a edição liberada pelo supervisor (403 se travada), e a liberação é
 * gasta neste salvamento — por isso revalida a trava.
 */
export function useUpdateAvailabilityWindows() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (windows: AvailabilityWindowPayload[]) => {
      await api.put('/enrollment/availability-windows', { windows });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['availability-lock'] }),
  });
}

export interface AvailabilityLock {
  editable: boolean;
  unlockedUntil: string | null;
  requestedAt: string | null;
  requestReason: string | null;
}

/** Situação da trava de disponibilidade do estagiário logado. */
export function useAvailabilityLock() {
  return useQuery({
    queryKey: ['availability-lock'],
    queryFn: async () => (await api.get<AvailabilityLock>('/enrollment/availability-lock')).data,
  });
}

/** Estagiário pede ao supervisor a liberação para alterar a disponibilidade. */
export function useRequestAvailabilityChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason: string) => {
      await api.post('/enrollment/availability-change-request', { reason });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-lock'] }),
  });
}

export interface AvailabilityRequest {
  internId: string;
  internName: string;
  ra: string | null;
  requestedAt: string | null;
  reason: string | null;
  /** Preenchido quando a edição já está liberada (e ainda não foi usada). */
  unlockedUntil: string | null;
}

/** Pedidos de mudança de disponibilidade e liberações em vigor (Supervisor: os seus; Admin: todos). */
export function useAvailabilityRequests() {
  return useQuery({
    queryKey: ['availability-requests'],
    queryFn: async () => (await api.get<AvailabilityRequest[]>('/availability-requests')).data,
  });
}

/** Libera (por `hours`) ou trava de novo a disponibilidade de um estagiário. */
export function useDecideAvailabilityRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { internId: string; unlock: boolean; hours?: number }) => {
      if (v.unlock) await api.post(`/interns/${v.internId}/availability-unlock`, { hours: v.hours ?? 48 });
      else await api.post(`/interns/${v.internId}/availability-relock`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['availability-requests'] }),
  });
}
