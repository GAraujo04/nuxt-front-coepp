<script setup lang="ts">
import { useReassignRoom, useRooms } from '../composables/useRooms';

// Painel Admin: status das salas (ocupada/disponível) e realocação manual.
// Equivalente a features/rooms/pages/RoomsAdmin.tsx.
const rooms = useRooms();
const reassign = useReassignRoom();
const picked = reactive<Record<string, string>>({});

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
function move(appointmentId: string) {
  const roomId = picked[appointmentId];
  if (roomId) reassign.mutate({ appointmentId, roomId });
}
</script>

<template>
  <section>
    <h2 class="mb-4 text-lg font-semibold text-body">Salas de atendimento</h2>
    <p v-if="reassign.isError.value" class="mb-3 text-sm text-danger">
      Não foi possível realocar — a sala de destino provavelmente já está ocupada nesse horário.
    </p>
    <ul class="space-y-2">
      <li v-for="r in rooms.data.value" :key="r.id" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div>
          <p class="text-sm font-medium text-body">
            {{ r.name }} <span class="pill" :class="r.occupiedBy ? 'pill-warn' : 'pill-ok'">{{ r.occupiedBy ? 'Ocupada' : 'Disponível' }}</span>
          </p>
          <p v-if="r.occupiedBy" class="text-xs text-muted">
            {{ r.occupiedBy.internName }} <span class="text-muted">↔</span> {{ r.occupiedBy.patientName }} — {{ formatDateTime(r.occupiedBy.scheduledAt) }}
          </p>
        </div>
        <div v-if="r.occupiedBy" class="flex items-center gap-2">
          <select
            class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-body focus:border-link focus:outline-none"
            :value="picked[r.occupiedBy.appointmentId] ?? ''"
            @change="picked[r.occupiedBy.appointmentId] = ($event.target as HTMLSelectElement).value"
          >
            <option value="">Mover para…</option>
            <option v-for="other in rooms.data.value?.filter((o) => o.id !== r.id)" :key="other.id" :value="other.id">{{ other.name }}</option>
          </select>
          <button
            :disabled="!picked[r.occupiedBy.appointmentId] || reassign.isPending.value"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
            @click="move(r.occupiedBy.appointmentId)"
          >
            Mover
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
