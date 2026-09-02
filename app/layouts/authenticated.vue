<script setup lang="ts">
import { useAuthStore } from '../stores/auth';
import { api } from '../shared/api/client';
import type { Role } from '../shared/auth/types';

const ROLE_LABEL: Record<string, string> = {
  INTERN: 'Estagiário(a)',
  SUPERVISOR: 'Supervisor(a)',
  ADMIN: 'Administrativo',
  PATIENT: 'Paciente',
};

interface NavItem {
  to: string;
  labelKey: string;
}

// Um item por rota real do papel — nunca um link pra página que não existe.
// A maioria dos papéis hoje só tem um destino principal; Supervisor é o
// único com dois (painel + fila de revisão).
const NAV_LINKS_BY_ROLE: Record<Role, NavItem[]> = {
  INTERN: [
    { to: '/estagiario', labelKey: 'nav.dashboard' },
    { to: '/estagiario/disponibilidade', labelKey: 'nav.availability' },
  ],
  SUPERVISOR: [
    { to: '/supervisao', labelKey: 'nav.dashboard' },
    { to: '/revisao', labelKey: 'nav.reviewQueue' },
  ],
  ADMIN: [{ to: '/admin', labelKey: 'nav.dashboard' }],
  PATIENT: [{ to: '/paciente', labelKey: 'nav.dashboard' }],
};

const { t } = useI18n();
const { user } = useAuth();
const store = useAuthStore();

const links = computed(() => (user.value ? NAV_LINKS_BY_ROLE[user.value.role] : []));

async function handleLogout() {
  try {
    await api.post('/auth/logout');
  } finally {
    store.clear();
    await navigateTo('/portal', { replace: true });
  }
}
</script>

<template>
  <div class="fsa-hero-bg min-h-screen">
    <header class="sticky top-0 z-10 flex items-center justify-between gap-4 bg-fsa-superficie px-6 py-3 shadow-sm">
      <NuxtLink to="/" class="font-semibold text-fsa-navy-marca hover:opacity-80">{{ t('app.name') }}</NuxtLink>
      <nav aria-label="Navegação principal" class="flex flex-1 items-center gap-5 text-sm">
        <!-- `custom` + v-slot dá acesso a isActive, igual ao className de
             função do NavLink no React (navLinkClass em AppLayout.tsx) —
             evita depender das classes automáticas router-link-active do
             Vue Router, mantendo o mesmo esquema de cores do original. -->
        <NuxtLink v-for="link in links" :key="link.to" v-slot="{ href, navigate, isActive }" :to="link.to" custom>
          <a :href="href ?? undefined" class="font-medium hover:text-link" :class="isActive ? 'text-link' : 'text-muted'" @click="navigate">
            {{ t(link.labelKey) }}
          </a>
        </NuxtLink>
      </nav>
      <div class="flex items-center gap-4 text-sm">
        <span v-if="user" class="text-muted">
          <span class="text-body">{{ user.fullName }}</span> · {{ ROLE_LABEL[user.role] ?? user.role }}
        </span>
        <button type="button" class="font-medium text-link hover:underline" @click="handleLogout">
          {{ t('nav.logout') }}
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-6xl p-6">
      <!-- Conteúdo das telas de trabalho continua em superfície clara —
           legibilidade de tabelas/formulários dependentes de texto denso
           importa mais aqui do que manter o gradiente visível atrás deles. -->
      <div class="rounded-lg bg-surface p-6 shadow-sm">
        <slot />
      </div>
    </main>
  </div>
</template>
