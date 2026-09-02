import { useMutation, useQuery } from '@tanstack/vue-query';
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

/** Substitui a disponibilidade recorrente do estagiário logado — editável a qualquer momento do semestre. */
export function useUpdateAvailabilityWindows() {
  return useMutation({
    mutationFn: async (windows: AvailabilityWindowPayload[]) => {
      await api.put('/enrollment/availability-windows', { windows });
    },
  });
}
