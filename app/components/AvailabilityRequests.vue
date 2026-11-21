<script setup lang="ts">
import { useAvailabilityRequests, useDecideAvailabilityRequest } from '../composables/useEnrollment';

// Pedidos de mudança de disponibilidade dos estagiários e liberações em
// vigor — só do supervisor, e só dos estagiários pelos quais ele responde
// (filtro no backend). O administrativo não decide: vê a alteração já feita
// em AvailabilityChanges. A liberação vale por um prazo e para UM
// salvamento — depois a disponibilidade trava de novo.
const HOURS_OPTIONS = [24, 48, 72, 168];

const requests = useAvailabilityRequests();
const decide = useDecideAvailabilityRequest();
const hours = reactive<Record<string, number>>({});

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <section>
    <h2 class="mb-1 text-lg font-semibold text-body">Alterações de disponibilidade</h2>
    <p class="mb-4 text-sm text-muted">
      A disponibilidade dos estagiários fica travada. Libere quando a mudança fizer sentido — a liberação vale para uma
      alteração dentro do prazo escolhido.
    </p>
    <p v-if="decide.isError.value" class="mb-3 text-sm text-danger">Não foi possível registrar a decisão. Tente novamente.</p>
    <p
      v-if="requests.data.value && requests.data.value.length === 0"
      class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted"
    >
      Nenhum pedido pendente.
    </p>
    <ul class="space-y-2">
      <li
        v-for="r in requests.data.value"
        :key="r.internId"
        class="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
      >
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-body">
            {{ r.internName }} <span v-if="r.ra" class="font-mono text-xs text-muted">RA {{ r.ra }}</span>
          </p>
          <template v-if="r.unlockedUntil">
            <p class="text-xs text-muted">Liberado até {{ formatDateTime(r.unlockedUntil) }} — aguardando o estagiário salvar.</p>
          </template>
          <template v-else>
            <p v-if="r.requestedAt" class="text-xs text-muted">Pedido em {{ formatDateTime(r.requestedAt) }}</p>
            <p class="mt-1 text-sm text-body">“{{ r.reason }}”</p>
          </template>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="!r.unlockedUntil">
            <select
              class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-body focus:border-link focus:outline-none"
              aria-label="Prazo da liberação"
              :value="hours[r.internId] ?? 48"
              @change="hours[r.internId] = Number(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="h in HOURS_OPTIONS" :key="h" :value="h">{{ h < 168 ? `${h}h` : '7 dias' }}</option>
            </select>
            <button
              :disabled="decide.isPending.value"
              class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
              @click="decide.mutate({ internId: r.internId, unlock: true, hours: hours[r.internId] ?? 48 })"
            >
              Liberar
            </button>
          </template>
          <button
            :disabled="decide.isPending.value"
            class="rounded-md border border-border px-3 py-1.5 text-sm text-danger hover:bg-surface2 disabled:opacity-50"
            @click="decide.mutate({ internId: r.internId, unlock: false })"
          >
            {{ r.unlockedUntil ? 'Revogar' : 'Recusar' }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
