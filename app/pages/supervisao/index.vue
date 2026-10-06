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
      class="flex items-center justify-between rounded-lg border border-border bg-surface p-5 shadow-sm hover:border-link"
    >
      <div>
        <h2 class="text-sm font-semibold text-body">Central de revisão</h2>
        <p class="text-xs text-muted">Documentos enviados pelos estagiários aguardando seu parecer.</p>
      </div>
      <span class="pill" :class="pending > 0 ? 'pill-info' : 'pill-muted'">{{ pending }} na fila</span>
    </NuxtLink>

    <AvailabilityRequests />

    <MatchesList />
  </div>
</template>
