<script setup lang="ts">
import { useReviewQueue } from '../../composables/useDocuments';

definePageMeta({ layout: 'authenticated', middleware: 'require-role', roles: ['SUPERVISOR'] });

// Painel do Supervisor: atalho para a central de revisão + visão dos
// pareamentos. Equivalente a features/supervision/pages/SupervisorDashboard.tsx.
const queue = useReviewQueue();
const pending = computed(() => queue.data.value?.length ?? 0);
</script>

<template>
  <div class="space-y-8">
    <NuxtLink
      to="/revisao"
      class="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link sm:p-5"
    >
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-body">Central de revisão</h2>
        <p class="text-xs text-muted">Documentos enviados pelos estagiários aguardando seu parecer.</p>
      </div>
      <span class="pill shrink-0" :class="pending > 0 ? 'pill-info' : 'pill-muted'">{{ pending }} na fila</span>
    </NuxtLink>

    <NuxtLink
      to="/relatorios"
      class="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link sm:p-5"
    >
      <div class="min-w-0">
        <h2 class="text-sm font-semibold text-body">Relatórios</h2>
        <p class="text-xs text-muted">Todos os documentos enviados, em ordem de chegada, com filtros por aluno, período e tipo.</p>
      </div>
      <span class="shrink-0 text-sm text-link">Abrir →</span>
    </NuxtLink>

    <AvailabilityRequests />

    <MatchesList />
  </div>
</template>
