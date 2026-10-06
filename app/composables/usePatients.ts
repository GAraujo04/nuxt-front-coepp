import { useQuery } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export interface DisabilitySummary {
  type: string;
  otherText: string | null;
}

export interface PatientSummary {
  id: string;
  code: string;
  /** null para o supervisor — ele identifica o paciente pelo código. */
  fullName: string | null;
  birthDate: string | null;
  isMinor: boolean;
  hasDisability: boolean;
  disabilities: DisabilitySummary[];
}

/** Lista os pacientes vinculados ao usuário (nome já descriptografado pelo backend). */
export function usePatients() {
  return useQuery({
    queryKey: ['patients'],
    queryFn: async () => (await api.get<PatientSummary[]>('/patients')).data,
  });
}
