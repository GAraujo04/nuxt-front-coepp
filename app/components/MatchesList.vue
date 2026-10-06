<script setup lang="ts">
import { useMatches, useRunMatching } from '../composables/useMatching';

// Lista de pareamentos (aluno ↔ paciente ↔ horário). `canRun` habilita o
// botão (Admin). Componente (não página) porque é embutido tanto em
// SupervisorDashboard quanto em AdminDashboard — igual ao React, onde
// MatchesList também é reusado nas duas telas apesar de morar em
// features/matching/pages/.
withDefaults(defineProps<{ canRun?: boolean }>(), { canRun: false });

const STATUS_PILL: Record<string, string> = {
  SCHEDULED: 'pill-info',
  ATTENDED: 'pill-ok',
  NO_SHOW: 'pill-warn',
  CANCELLED: 'pill-muted',
};

const matches = useMatches();
const run = useRunMatching();

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <section>
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-body">Pareamentos e consultas</h2>
      <button
        v-if="canRun"
        :disabled="run.isPending.value"
        class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        @click="run.mutate()"
      >
        {{ run.isPending.value ? 'Pareando…' : 'Rodar pareamento' }}
      </button>
    </div>

    <p v-if="run.isSuccess.value" class="mb-3 text-sm text-ok">
      {{ run.data.value && run.data.value.matched > 0 ? `${run.data.value.matched} novo(s) pareamento(s) criado(s).` : 'Nenhum novo par encontrado (sem horários coincidentes).' }}
    </p>

    <p v-if="matches.data.value && matches.data.value.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      Nenhum pareamento ainda. {{ canRun ? 'Rode o pareamento quando houver cadastros com horários coincidentes.' : '' }}
    </p>

    <ul class="space-y-2">
      <li v-for="m in matches.data.value" :key="m.appointmentId" class="flex items-center justify-between rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-body">{{ m.internName }} <span class="text-muted">↔</span> {{ m.patientName ?? `Paciente ${m.patientCode}` }}</p>
          <p class="text-xs text-muted">
            {{ formatDateTime(m.scheduledAt) }}
            <span v-if="m.roomName"> · {{ m.roomName }}</span>
          </p>
        </div>
        <span class="pill" :class="STATUS_PILL[m.status] ?? 'pill-muted'">{{ m.status }}</span>
      </li>
    </ul>
  </section>
</template>
