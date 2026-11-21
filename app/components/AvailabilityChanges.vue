<script setup lang="ts">
import { useAvailabilityChanges } from '../composables/useEnrollment';
import { formatWindow } from '../shared/lib/weekdays';

// Painel Admin: estagiários que alteraram a disponibilidade nos últimos 30
// dias, com o horário NOVO. Liberar a alteração é do supervisor
// (AvailabilityRequests, na tela dele); o administrativo só precisa saber
// que mudou e em que horários o aluno passa a atender, para o pareamento.
const changes = useAvailabilityChanges();

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <section>
    <h2 class="mb-1 text-lg font-semibold text-body">Disponibilidade alterada</h2>
    <p class="mb-4 text-sm text-muted">
      Estagiários que mudaram os horários nos últimos 30 dias, com a disponibilidade nova. A liberação é feita pelo
      supervisor.
    </p>
    <p
      v-if="changes.data.value && changes.data.value.length === 0"
      class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted"
    >
      Nenhuma alteração recente.
    </p>
    <ul class="space-y-2">
      <li v-for="c in changes.data.value" :key="c.internId" class="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm font-medium text-body">
            {{ c.internName }} <span v-if="c.ra" class="font-mono text-xs text-muted">RA {{ c.ra }}</span>
          </p>
          <p class="text-xs text-muted">Alterada em {{ formatDateTime(c.changedAt) }}</p>
        </div>
        <ul class="mt-2 flex flex-wrap gap-2">
          <li
            v-for="w in c.windows"
            :key="`${w.weekday}-${w.startTime}`"
            class="rounded-md bg-surface2 px-2 py-1 text-xs text-body"
          >
            {{ formatWindow(w) }}
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>
