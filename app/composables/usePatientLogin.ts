import { useMutation } from '@tanstack/vue-query';
import { api } from '../shared/api/client';
import { useAuthStore } from '../stores/auth';
import type { AuthUser } from '../shared/auth/types';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/** Login do paciente por CPF + data de nascimento (sem senha). */
export function usePatientLogin() {
  const store = useAuthStore();
  return useMutation({
    mutationFn: async (creds: { cpf: string; birthDate: string }) => {
      const { data } = await api.post<LoginResponse>('/auth/patient-login', creds);
      return data;
    },
    onSuccess: (data) => store.setSession(data.user, data.accessToken),
  });
}
