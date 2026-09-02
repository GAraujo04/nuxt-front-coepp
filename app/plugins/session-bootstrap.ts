import { api } from '../shared/api/client';
import { useAuthStore } from '../stores/auth';
import type { AuthUser } from '../shared/auth/types';

/**
 * Reidrata a sessão ao carregar a app: tenta um refresh silencioso (cookie
 * httpOnly) e, se válido, busca /auth/me. Sem sessão, marca status
 * 'anonymous'. Roda uma vez, no boot — equivalente ao SessionGate do React,
 * só que aqui não precisa de um componente "portão" envolvendo o roteador:
 * o plugin já roda antes de qualquer página montar.
 */
export default defineNuxtPlugin(async () => {
  const store = useAuthStore();
  if (store.status !== 'idle') return;
  store.status = 'authenticating';

  try {
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    store.setAccessToken(data.accessToken);
    const me = await api.get<AuthUser>('/auth/me');
    store.setSession(me.data, data.accessToken);
  } catch {
    store.clear();
  }
});
