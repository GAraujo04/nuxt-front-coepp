<script setup lang="ts">
import type { Role } from '../shared/auth/types';

// Equivalente a app/HomeRedirect.tsx: envia o usuário autenticado ao painel
// do seu papel; anônimo vai ao portal (hub de logins).
const HOME_BY_ROLE: Record<Role, string> = {
  INTERN: '/estagiario',
  SUPERVISOR: '/supervisao',
  ADMIN: '/admin',
  PATIENT: '/paciente',
};

const { isAuthenticated, user } = useAuth();

await navigateTo(isAuthenticated.value && user.value ? HOME_BY_ROLE[user.value.role] : '/portal', { replace: true });
</script>

<template>
  <p class="p-8 text-center text-sm text-muted">Carregando…</p>
</template>
