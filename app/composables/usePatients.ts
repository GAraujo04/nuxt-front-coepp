import { useQuery } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

export interface DisabilitySummary {
  type: string;
  otherText: string | null;
}

export interface PatientSummary {
  id: string;
  code: string;
  fullName: string;
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
