<script setup lang="ts">
import { useReviewQueue } from '../../composables/useDocuments';
import { DOC_TYPE_LABEL } from '../../shared/screening/fields';

definePageMeta({ layout: 'authenticated', middleware: 'require-role', roles: ['SUPERVISOR'] });

// Fila de documentos aguardando revisão do supervisor. Equivalente a
// features/documents/pages/ReviewQueue.tsx.
// Todos os tipos, não só as triagens: os documentos de estágio também
// passam pela fila e apareciam com o código cru (ex.: "EVOLUTION").
const TYPE_LABEL: Record<string, string> = DOC_TYPE_LABEL;
const PILL: Record<string, string> = { ENVIADO_PARA_SUPERVISAO: 'pill-info', EM_REVISAO: 'pill-info' };

const queue = useReviewQueue();
</script>

<template>
  <section>
    <NuxtLink to="/supervisao" class="mb-3 inline-block text-sm font-medium text-link hover:underline">← Voltar ao painel</NuxtLink>
    <h1 class="mb-4 text-lg font-semibold text-body">Central de revisão</h1>
    <p v-if="queue.data.value && queue.data.value.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      Nenhum documento aguardando revisão.
    </p>
    <ul class="space-y-2">
      <li v-for="d in queue.data.value" :key="d.id">
        <NuxtLink
          :to="`/revisao/${d.id}`"
          class="flex items-center justify-between rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link"
        >
          <div>
            <p class="text-sm font-medium text-body">
              {{ TYPE_LABEL[d.type] ?? d.type }} <span class="ml-1 font-mono text-xs text-muted">Nº {{ d.patientCode }}</span>
            </p>
            <p class="text-xs text-muted">Paciente: {{ d.patientName }} · Estagiário: {{ d.authorName }}</p>
          </div>
          <span class="pill" :class="PILL[d.status] ?? 'pill-muted'">{{ d.status }}</span>
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>
