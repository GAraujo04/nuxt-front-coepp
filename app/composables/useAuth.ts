import { useAuthStore } from '../stores/auth';
import type { Role } from '../shared/auth/types';

/** Acesso ergonômico ao estado de sessão + checagem de papel. */
export function useAuth() {
  const store = useAuthStore();
  return {
    user: computed(() => store.user),
    status: computed(() => store.status),
    isAuthenticated: computed(() => store.status === 'authenticated' && store.user !== null),
    hasRole: (roles: Role[]) => (store.user ? roles.includes(store.user.role) : false),
  };
}
