import type { Role } from '../shared/auth/types';

/**
 * Route guard por papel (RBAC no front — camada de UX). A autorização REAL e
 * a verificação de vínculo acontecem sempre no backend; isto só evita
 * navegar pra telas que o usuário não pode ver.
 *
 * Equivalente a shared/auth/RequireRole.tsx do React, mas como middleware de
 * rota em vez de componente que envolve a árvore — cada página declara:
 *   definePageMeta({ middleware: 'require-role', roles: ['INTERN'] })
 *
 * Não existe branch de "carregando…" aqui (diferente do React): o plugin de
 * bootstrap (plugins/session-bootstrap.ts) é aguardado pelo Nuxt antes de
 * montar a app, então quando este middleware roda, status já é sempre
 * 'authenticated' ou 'anonymous' — nunca 'idle'/'authenticating'.
 */
export default defineNuxtRouteMiddleware((to) => {
  const roles = to.meta.roles as Role[] | undefined;
  if (!roles) return; // página sem roles declarados — middleware inofensivo

  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated.value) {
    // Vale tanto pra acesso direto sem sessão quanto pro logout (AppLayout)
    // — nos dois casos, /portal é o hub que deixa a pessoa escolher a tela
    // de login certa, em vez de sempre cair no login do admin.
    return navigateTo('/portal', { replace: true });
  }
  if (!hasRole(roles)) {
    return navigateTo('/403', { replace: true });
  }
});
