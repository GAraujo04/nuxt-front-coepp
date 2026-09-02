import { useMutation } from '@tanstack/vue-query';
import { api } from '../shared/api/client';
import { useAuthStore } from '../stores/auth';
import type { AuthUser } from '../shared/auth/types';

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

/** Mutation de login: POST /auth/login e, no sucesso, popula a sessão global. */
export function useLogin() {
  const store = useAuthStore();
  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => store.setSession(data.user, data.accessToken),
  });
}
