import { defineStore } from 'pinia';
import type { AuthUser } from '../shared/auth/types';

/**
 * Estado global de sessão (Pinia — equivalente ao Zustand original). Guarda
 * o access token em memória (NÃO em localStorage — reduz superfície a XSS).
 * O refresh token vive em cookie httpOnly gerenciado pelo backend. Ao dar
 * F5, a sessão é reidratada via /auth/refresh (ver plugin de bootstrap).
 */
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as AuthUser | null,
    accessToken: null as string | null,
    status: 'idle' as 'idle' | 'authenticating' | 'authenticated' | 'anonymous',
  }),
  actions: {
    setSession(user: AuthUser, accessToken: string) {
      this.user = user;
      this.accessToken = accessToken;
      this.status = 'authenticated';
    },
    setAccessToken(accessToken: string) {
      this.accessToken = accessToken;
    },
    /** Atualiza local o profileComplete do estagiário logo após completar o
     *  cadastro — sem isso, o guard de rota continuaria redirecionando pra
     *  /completar-cadastro com o dado velho da sessão. */
    setProfileComplete(complete: boolean) {
      if (this.user) this.user.profileComplete = complete;
    },
    clear() {
      this.user = null;
      this.accessToken = null;
      this.status = 'anonymous';
    },
  },
});
