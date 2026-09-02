<script setup lang="ts">
export interface AvailabilityWindowValue {
  weekday: number; // 0=domingo .. 6=sábado
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

// Seletor de disponibilidade recorrente: dia da semana + horário de início e
// fim, com adicionar/remover. NÃO é um agendamento de consulta — é a janela
// em que a pessoa costuma estar disponível. Equivalente a
// shared/ui/WeeklyAvailabilityPicker.tsx.
const windows = defineModel<AvailabilityWindowValue[]>({ required: true });

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const fieldClass = 'rounded-md border border-border bg-surface px-2 py-2 text-sm text-body focus:border-link focus:outline-none';

function update(i: number, patch: Partial<AvailabilityWindowValue>) {
  windows.value = windows.value.map((w, idx) => (idx === i ? { ...w, ...patch } : w));
}
function add() {
  windows.value = [...windows.value, { weekday: 1, startTime: '', endTime: '' }];
}
function remove(i: number) {
  windows.value = windows.value.filter((_, idx) => idx !== i);
}
</script>

<template>
  <div class="space-y-2">
    <div v-for="(w, i) in windows" :key="i" class="flex flex-wrap items-center gap-2">
      <select
        :class="fieldClass"
        :value="w.weekday"
        aria-label="Dia da semana"
        @change="update(i, { weekday: Number(($event.target as HTMLSelectElement).value) })"
      >
        <option v-for="(label, value) in WEEKDAY_LABELS" :key="value" :value="value">{{ label }}</option>
      </select>
      <input
        type="time"
        :class="fieldClass"
        :value="w.startTime"
        aria-label="Horário de início"
        required
        @input="update(i, { startTime: ($event.target as HTMLInputElement).value })"
      >
      <span class="text-sm text-muted">até</span>
      <input
        type="time"
        :class="fieldClass"
        :value="w.endTime"
        aria-label="Horário de fim"
        required
        @input="update(i, { endTime: ($event.target as HTMLInputElement).value })"
      >
      <button
        type="button"
        class="rounded-md border border-border px-2 py-2 text-xs text-muted hover:bg-surface2"
        aria-label="Remover janela"
        @click="remove(i)"
      >
        ✕
      </button>
    </div>
    <button type="button" class="text-sm font-medium text-link hover:underline" @click="add">+ Adicionar horário</button>
  </div>
</template>
