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
    { to: '/relatorios', labelKey: 'nav.reports' },
  ],
  ADMIN: [{ to: '/admin', labelKey: 'nav.dashboard' }],
  PATIENT: [{ to: '/paciente', labelKey: 'nav.dashboard' }],
};

const { t } = useI18n();
const { user } = useAuth();
const store = useAuthStore();

const links = computed(() => (user.value ? NAV_LINKS_BY_ROLE[user.value.role] : []));
// Paciente não tem avisos (nada a revisar nem a decidir): sem sininho, e
// sem a consulta periódica que ele faria.
const showBell = computed(() => !!user.value && user.value.role !== 'PATIENT');

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
    <!-- Mobile: logo + ações na 1ª linha, navegação na 2ª (order-last +
         w-full, rolando na horizontal se não couber). A partir de md tudo
         volta para uma linha só. -->
    <header class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-fsa-superficie px-4 py-3 shadow-sm sm:px-6">
      <NuxtLink to="/" class="shrink-0 hover:opacity-80">
        <img src="/logo-fsa-horizontal.png" :alt="t('app.name')" class="h-7 w-auto sm:h-8">
      </NuxtLink>
      <nav
        aria-label="Navegação principal"
        class="order-last -mx-1 flex w-full items-center gap-5 overflow-x-auto px-1 text-sm whitespace-nowrap md:order-none md:mx-0 md:w-auto md:flex-1 md:px-0"
      >
        <!-- `custom` + v-slot dá acesso a isActive, igual ao className de
             função do NavLink no React (navLinkClass em AppLayout.tsx) —
             evita depender das classes automáticas router-link-active do
             Vue Router, mantendo o mesmo esquema de cores do original. -->
        <NuxtLink v-for="link in links" :key="link.to" v-slot="{ href, navigate, isActive }" :to="link.to" custom>
          <a
            :href="href ?? undefined"
            class="font-medium hover:text-fsa-header-link"
            :class="isActive ? 'text-fsa-header-link' : 'text-fsa-header-muted'"
            @click="navigate"
          >
            {{ t(link.labelKey) }}
          </a>
        </NuxtLink>
      </nav>
      <div class="flex min-w-0 items-center gap-3 text-sm sm:gap-4">
        <NotificationBell v-if="showBell" />
        <!-- text-fsa-header-*, não text-muted/text-link/text-body: este
             header usa --fsa-superficie (fixo, claro) como fundo em
             qualquer tema — os tokens reativos ao tema ficam ilegíveis
             aqui quando o app está no modo escuro (ver nota no main.css). -->
        <!-- No celular o nome completo não cabe ao lado do logo: some e fica
             só o papel; o nome volta a partir de sm. -->
        <span v-if="user" class="min-w-0 truncate text-fsa-header-muted">
          <span class="hidden text-fsa-header-text sm:inline">{{ user.fullName }} · </span>{{ ROLE_LABEL[user.role] ?? user.role }}
        </span>
        <!-- Pedido explícito: um botão só (não Portal + Sair separados).
             "Portal" agora FAZ o logout (limpa sessão + POST /auth/logout)
             antes de ir pro hub — assim escolher outro login lá já parte de
             sessão limpa, em vez de simplesmente navegar mantendo a sessão
             atual (que é o que causava o "volta pro painel errado" ao tentar
             logar como outro papel sem sair antes). -->
        <button type="button" class="shrink-0 font-medium text-fsa-header-link hover:underline" @click="handleLogout">
          Portal
        </button>
      </div>
    </header>
    <main class="mx-auto max-w-6xl p-3 sm:p-6">
      <!-- Conteúdo das telas de trabalho continua em superfície clara —
           legibilidade de tabelas/formulários dependentes de texto denso
           importa mais aqui do que manter o gradiente visível atrás deles. -->
      <div class="rounded-lg bg-surface p-4 shadow-sm sm:p-6">
        <slot />
      </div>
    </main>
  </div>
</template>
