<script setup lang="ts">
import { useMatches, useRunMatching } from '../composables/useMatching';
import { useCancelAppointment, useRescheduleAppointment } from '../composables/useAgenda';
import { useRooms } from '../composables/useRooms';
import { apiErrorCode } from '../shared/api/error-code';

// Lista de pareamentos (aluno ↔ paciente ↔ horário). `canRun` habilita o
// botão (Admin). Componente (não página) porque é embutido tanto em
// SupervisorDashboard quanto em AdminDashboard — igual ao React, onde
// MatchesList também é reusado nas duas telas apesar de morar em
// features/matching/pages/.
//
// No admin (`canRun`), consulta ainda agendada ganha Remarcar e Cancelar:
// com a agenda semanal automática, feriado e falta avisada são ajustados
// aqui. O supervisor só visualiza.
const props = withDefaults(defineProps<{ canRun?: boolean }>(), { canRun: false });

const STATUS_PILL: Record<string, string> = {
  SCHEDULED: 'pill-info',
  ATTENDED: 'pill-ok',
  NO_SHOW: 'pill-warn',
  CANCELLED: 'pill-muted',
};
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  ATTENDED: 'Compareceu',
  NO_SHOW: 'Faltou',
  CANCELLED: 'Cancelada',
};
const fieldClass =
  'rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-body focus:border-link focus:outline-none';

const matches = useMatches();
const run = useRunMatching();
const cancel = useCancelAppointment();
const reschedule = useRescheduleAppointment();
// Salas só no admin: a rota de salas é exclusiva dele.
const rooms = props.canRun ? useRooms() : null;

const editing = ref<string | null>(null);
const draft = reactive<{ when: string; roomId: string }>({ when: '', roomId: '' });

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
/** ISO -> valor de <input type="datetime-local"> no fuso local. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function startReschedule(appointmentId: string, scheduledAt: string, roomName: string | null) {
  editing.value = appointmentId;
  draft.when = toLocalInput(scheduledAt);
  draft.roomId = rooms?.data.value?.find((r) => r.name === roomName)?.id ?? '';
}
function saveReschedule(id: string) {
  if (!draft.when) return;
  reschedule.mutate(
    // datetime-local é hora local; new Date(...) interpreta assim e o
    // toISOString manda o instante em UTC, como o backend espera.
    { id, scheduledAt: new Date(draft.when).toISOString(), roomId: draft.roomId || null },
    { onSuccess: () => (editing.value = null) },
  );
}
function onCancel(id: string, following: boolean) {
  const msg = following
    ? 'Cancelar esta consulta e todas as seguintes deste par?'
    : 'Cancelar só esta consulta?';
  if (window.confirm(msg)) cancel.mutate({ id, following });
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
    <p v-if="cancel.isSuccess.value && cancel.data.value" class="mb-3 text-sm text-ok">
      {{ cancel.data.value.cancelled }} consulta(s) cancelada(s).
    </p>
    <p v-if="cancel.isError.value" class="mb-3 text-sm text-danger">Não foi possível cancelar — a consulta pode já ter sido realizada.</p>
    <p v-if="reschedule.isError.value" class="mb-3 text-sm text-danger">
      {{
        apiErrorCode(reschedule.error.value) === 'conflict'
          ? 'A sala está ocupada nesse horário (ou a consulta já não está agendada). Escolha outra sala ou horário.'
          : 'Não foi possível remarcar. Confira a data — ela precisa estar no futuro.'
      }}
    </p>

    <p v-if="matches.data.value && matches.data.value.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      Nenhum pareamento ainda. {{ canRun ? 'Rode o pareamento quando houver cadastros com horários coincidentes.' : '' }}
    </p>

    <ul class="space-y-2">
      <li v-for="m in matches.data.value" :key="m.appointmentId" class="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-body">{{ m.internName }} <span class="text-muted">↔</span> {{ m.patientName ?? `Paciente ${m.patientCode}` }}</p>
            <p class="text-xs text-muted">
              {{ formatDateTime(m.scheduledAt) }}
              <span v-if="m.roomName"> · {{ m.roomName }}</span>
              <span v-else-if="m.status === 'SCHEDULED'"> · sem sala</span>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <template v-if="canRun && m.status === 'SCHEDULED' && editing !== m.appointmentId">
              <button class="rounded-md border border-border px-2 py-1 text-xs text-body hover:bg-surface2" @click="startReschedule(m.appointmentId, m.scheduledAt, m.roomName)">
                Remarcar
              </button>
              <button :disabled="cancel.isPending.value" class="rounded-md border border-border px-2 py-1 text-xs text-danger hover:bg-surface2" @click="onCancel(m.appointmentId, false)">
                Cancelar
              </button>
              <button :disabled="cancel.isPending.value" class="rounded-md border border-border px-2 py-1 text-xs text-danger hover:bg-surface2" @click="onCancel(m.appointmentId, true)">
                Cancelar esta e seguintes
              </button>
            </template>
            <span class="pill" :class="STATUS_PILL[m.status] ?? 'pill-muted'">{{ STATUS_LABEL[m.status] ?? m.status }}</span>
          </div>
        </div>

        <form v-if="editing === m.appointmentId" class="mt-3 flex flex-wrap items-center gap-2" @submit.prevent="saveReschedule(m.appointmentId)">
          <input v-model="draft.when" type="datetime-local" :class="fieldClass" aria-label="Nova data e hora" required>
          <select v-model="draft.roomId" :class="fieldClass" aria-label="Sala">
            <option value="">Sem sala</option>
            <option v-for="r in rooms?.data.value" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <button type="submit" :disabled="reschedule.isPending.value" class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50">
            Salvar
          </button>
          <button type="button" class="rounded-md border border-border px-3 py-1.5 text-sm text-body hover:bg-surface2" @click="editing = null">
            Voltar
          </button>
        </form>
      </li>
    </ul>
  </section>
</template>
