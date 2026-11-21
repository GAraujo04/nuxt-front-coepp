<script setup lang="ts">
import { usePendingMatchRequests, useResolvePendingMatchRequest } from '../composables/useMatching';

// Alerta de fallback por aproximação (item 5 do escopo original): pacientes
// que não tiveram match exato na última rodada de pareamento.
// suggestedInternName/At vêm nulos quando nenhum estagiário tinha
// disponibilidade cadastrada — mesmo assim o paciente fica visível aqui, só
// sem sugestão de horário. Equivalente a
// features/matching/pages/PendingMatchAlerts.tsx.
const pending = usePendingMatchRequests();
const resolve = useResolvePendingMatchRequest();

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <div v-if="!pending.isLoading.value && pending.data.value && pending.data.value.length > 0" class="rounded-lg border border-warn bg-surface p-4 shadow-sm">
    <h2 class="mb-1 text-sm font-semibold text-body">
      Pacientes sem horário compatível <span class="pill-warn ml-1 rounded px-2 py-0.5">{{ pending.data.value.length }}</span>
    </h2>
    <p class="mb-3 text-xs text-muted">
      Nenhum estagiário tinha disponibilidade suficiente pra esses pacientes na última rodada. O horário sugerido é
      só uma aproximação (mais próximo disponível) — entre em contato com o paciente pra negociar.
    </p>
    <ul class="space-y-2">
      <li v-for="r in pending.data.value" :key="r.id" class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-surface2 p-3 text-sm">
        <div>
          <p class="font-medium text-body">Paciente <span class="font-mono">Nº {{ r.patientCode }}</span></p>
          <p v-if="r.suggestedInternName && r.suggestedAt" class="text-xs text-muted">
            Sugestão: {{ r.suggestedInternName }}, {{ formatDateTime(r.suggestedAt) }}
          </p>
          <p v-else class="text-xs text-muted">Nenhum estagiário com disponibilidade cadastrada no momento.</p>
        </div>
        <button
          :disabled="resolve.isPending.value"
          class="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-body hover:bg-surface disabled:opacity-50"
          @click="resolve.mutate(r.id)"
        >
          Marcar como resolvido
        </button>
      </li>
    </ul>
  </div>
</template>
