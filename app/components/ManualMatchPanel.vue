<script setup lang="ts">
import { isAxiosError } from 'axios';
import { useUsersByRole } from '../composables/useUsers';
import { usePatients } from '../composables/usePatients';
import { ROOM_CATEGORY_LABEL, useRooms } from '../composables/useRooms';
import { useCreateManualMatch, useSuggestions } from '../composables/useMatching';
import type { ManualMatchWarning } from '../composables/useMatching';

// Match manual (item 7 do escopo original): mostra os pares que o sistema
// sugeriria e permite ao admin montar um par diferente. Conflitos (horário
// incompatível, sala ocupada) avisam mas não bloqueiam — a confirmação é um
// passo explícito. Equivalente a features/matching/pages/ManualMatchPanel.tsx.
const fieldClass = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

const suggestions = useSuggestions();
const patients = usePatients();
const interns = useUsersByRole('INTERN');
const rooms = useRooms();
const createManual = useCreateManualMatch();

const form = reactive({ patientId: '', internId: '', scheduledAt: '', roomId: '' });
const pendingWarnings = ref<ManualMatchWarning[] | null>(null);
const created = ref<{ appointmentId: string; warnings: ManualMatchWarning[] } | null>(null);

function clearFeedback() {
  pendingWarnings.value = null;
  created.value = null;
}

function submit(acknowledgeWarnings: boolean) {
  createManual.mutate(
    {
      patientId: form.patientId,
      internId: form.internId,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
      roomId: form.roomId || undefined,
      acknowledgeWarnings,
    },
    {
      onSuccess: (data) => {
        pendingWarnings.value = null;
        created.value = data;
      },
      onError: (err) => {
        if (isAxiosError<{ warnings?: ManualMatchWarning[] }>(err) && err.response?.status === 409) {
          pendingWarnings.value = err.response.data.warnings ?? [];
        }
      },
    },
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <section class="mt-8 space-y-4 border-t border-border pt-6">
    <h3 class="text-sm font-semibold text-body">Match manual</h3>
    <p class="text-xs text-muted">Monta um match específico, sobrepondo a sugestão automática — para casos de prioridade no atendimento.</p>

    <div v-if="suggestions.data.value && suggestions.data.value.length > 0" class="rounded-lg border border-dashed border-border p-4">
      <p class="mb-2 text-xs font-semibold text-muted">Sugestões do sistema (não persistidas)</p>
      <ul class="space-y-1 text-xs text-muted">
        <li v-for="s in suggestions.data.value" :key="`${s.patientId}-${s.internId}`">
          {{ s.internName }} <span class="text-body">↔</span> {{ s.patientName }} — {{ s.roomName }} — {{ formatDateTime(s.scheduledAt) }}
        </li>
      </ul>
    </div>

    <form class="grid gap-3 sm:grid-cols-2" @submit.prevent="submit(false)">
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Paciente</span>
        <select v-model="form.patientId" :class="fieldClass" required @change="clearFeedback">
          <option value="">Selecione…</option>
          <option v-for="p in patients.data.value" :key="p.id" :value="p.id">{{ p.code }} — {{ p.fullName }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Estagiário</span>
        <select v-model="form.internId" :class="fieldClass" required @change="clearFeedback">
          <option value="">Selecione…</option>
          <option v-for="u in interns.data.value" :key="u.id" :value="u.id">{{ u.fullName }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Data/hora da consulta</span>
        <input v-model="form.scheduledAt" type="datetime-local" :class="fieldClass" required @change="clearFeedback">
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Sala (opcional)</span>
        <select v-model="form.roomId" :class="fieldClass" @change="clearFeedback">
          <option value="">Sem sala definida</option>
          <option v-for="r in rooms.data.value" :key="r.id" :value="r.id">{{ r.name }} ({{ ROOM_CATEGORY_LABEL[r.category] }})</option>
        </select>
      </label>

      <div v-if="pendingWarnings && pendingWarnings.length > 0" class="rounded-md border border-warn/40 bg-surface2 p-3 text-sm sm:col-span-2">
        <p class="mb-1 font-semibold text-warn">Conflitos encontrados — confirme para continuar:</p>
        <ul class="mb-3 list-inside list-disc text-body">
          <li v-for="w in pendingWarnings" :key="w.code">{{ w.message }}</li>
        </ul>
        <button
          type="button"
          :disabled="createManual.isPending.value"
          class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
          @click="submit(true)"
        >
          Confirmar mesmo assim
        </button>
      </div>

      <p v-if="created" class="text-sm text-ok sm:col-span-2">
        Match criado{{ created.warnings.length > 0 ? ' com os avisos acima confirmados.' : '.' }}
      </p>

      <button
        type="submit"
        :disabled="createManual.isPending.value"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60 sm:col-span-2"
      >
        {{ createManual.isPending.value ? 'Enviando…' : 'Criar match manual' }}
      </button>
    </form>
  </section>
</template>
