import { useMutation } from '@tanstack/vue-query';
import { api } from '../shared/api/client';
import { useAuthStore } from '../stores/auth';
import type { AuthUser } from '../shared/auth/types';

interface InternLoginResponse {
  accessToken: string;
  user: AuthUser;
}

/** Login do estagiário via TOTVS RM (usuário/senha institucionais). */
export function useInternLogin() {
  const store = useAuthStore();
  return useMutation({
    mutationFn: async (creds: { usuarioRm: string; senhaRm: string; linkEmail?: string }) => {
      const { data } = await api.post<InternLoginResponse>('/auth/intern-login', creds);
      return data;
    },
    onSuccess: (data) => store.setSession(data.user, data.accessToken),
  });
}
