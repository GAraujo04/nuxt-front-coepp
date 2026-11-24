<script setup lang="ts">
import { useLinkSupervisor, usePendingSupervisors } from '../composables/useUsers';

// Alunos que se autocadastraram com "Outro" em supervisor — pendentes de
// vínculo. Equivalente ao helper local `PendingSupervisors` de
// AdminDashboard.tsx (mesmo motivo de virar componente próprio que AdminList).
defineProps<{ supervisors?: { id: string; fullName: string }[] }>();

const pending = usePendingSupervisors();
const link = useLinkSupervisor();
const picked = reactive<Record<string, string>>({});

function linkPicked(patientLinkId: string) {
  const supervisorId = picked[patientLinkId];
  if (supervisorId) link.mutate({ id: patientLinkId, supervisorId });
}
</script>

<template>
  <div v-if="pending.data.value && pending.data.value.length > 0" class="rounded-lg border border-warn/40 bg-surface2 p-5">
    <h2 class="mb-1 text-sm font-semibold text-body">
      Supervisores pendentes <span class="text-muted">({{ pending.data.value.length }})</span>
    </h2>
    <p class="mb-3 text-xs text-muted">
      Alunos que se cadastraram com "Outro" porque o supervisor ainda não estava no sistema. Cadastre o supervisor
      acima e depois vincule aqui.
    </p>
    <ul class="space-y-2">
      <li v-for="p in pending.data.value" :key="p.id" class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface p-3">
        <div class="min-w-0 text-sm">
          <p class="font-medium break-words text-body">{{ p.fullName }} <span class="break-all text-muted">({{ p.email }})</span></p>
          <p class="text-xs text-muted">Informou: "{{ p.pendingSupervisorName }}"</p>
        </div>
        <div class="flex w-full items-center gap-2 sm:w-auto">
          <select
            class="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-body focus:border-link focus:outline-none"
            :value="picked[p.id] ?? ''"
            @change="picked[p.id] = ($event.target as HTMLSelectElement).value"
          >
            <option value="">Selecione o supervisor…</option>
            <option v-for="s in supervisors" :key="s.id" :value="s.id">{{ s.fullName }}</option>
          </select>
          <button
            :disabled="!picked[p.id] || link.isPending.value"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
            @click="linkPicked(p.id)"
          >
            Vincular
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
