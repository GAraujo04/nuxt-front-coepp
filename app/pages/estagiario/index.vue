<script setup lang="ts">
import { useAgenda, useRegisterAttendance } from '../../composables/useAgenda';
import { useAuth } from '../../composables/useAuth';
import { usePatients } from '../../composables/usePatients';
import { useScreenings } from '../../composables/useScreenings';
import type { Appointment, AppointmentStatus } from '../../composables/useAgenda';
import { patientDisplayName } from '../../shared/lib/patient-display';

definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// Dashboard do Estagiário: agenda (com presença) + meus pacientes
// (relatórios por paciente). Equivalente a
// features/appointments/pages/InternDashboard.tsx.
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Agendada',
  ATTENDED: 'Compareceu',
  NO_SHOW: 'Faltou',
  CANCELLED: 'Cancelada',
};
const STATUS_PILL: Record<AppointmentStatus, string> = {
  SCHEDULED: 'pill-info',
  ATTENDED: 'pill-ok',
  NO_SHOW: 'pill-warn',
  CANCELLED: 'pill-muted',
};

const { user } = useAuth();
const agenda = useAgenda();
const attendance = useRegisterAttendance();
const patients = usePatients();
const screenings = useScreenings();

function countFor(patientId: string) {
  return screenings.data.value?.filter((s) => s.patientId === patientId).length ?? 0;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Agenda agrupada por paciente: o pareamento cria uma consulta por semana
// do período, e a lista plana ficava enorme (o mesmo paciente repetido
// semana a semana). Cada card mostra só o que pede ação — sessões já
// passadas sem presença marcada + a próxima — e o resto fica recolhido.
const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

type Appt = Appointment;
interface PatientAgenda {
  patientId: string;
  patientCode: string | null;
  /** Rótulo do horário fixo, tirado da próxima sessão agendada. */
  weekly: string | null;
  roomName: string | null;
  /** Sessões em destaque: pendentes de presença + a próxima. */
  highlight: Appt[];
  rest: Appt[];
  attended: number;
  noShow: number;
  overdue: number;
}

function weeklyLabel(iso: string) {
  const d = new Date(iso);
  return `Toda ${WEEKDAY[d.getDay()]}, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

const byPatient = computed<PatientAgenda[]>(() => {
  const now = Date.now();
  const groups = new Map<string, Appt[]>();
  for (const a of agenda.data.value ?? []) groups.set(a.patientId, [...(groups.get(a.patientId) ?? []), a]);

  return [...groups.values()]
    .map((list) => {
      const sorted = [...list].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      const scheduled = sorted.filter((a) => a.status === 'SCHEDULED');
      const overdue = scheduled.filter((a) => new Date(a.scheduledAt).getTime() <= now);
      const next = scheduled.find((a) => new Date(a.scheduledAt).getTime() > now) ?? null;
      const highlight = next ? [...overdue, next] : overdue;
      const ref = next ?? scheduled[scheduled.length - 1] ?? null;
      return {
        patientId: sorted[0]!.patientId,
        patientCode: sorted[0]!.patientCode,
        weekly: ref ? weeklyLabel(ref.scheduledAt) : null,
        roomName: ref?.roomName ?? null,
        highlight,
        rest: sorted.filter((a) => !highlight.includes(a)),
        attended: sorted.filter((a) => a.status === 'ATTENDED').length,
        noShow: sorted.filter((a) => a.status === 'NO_SHOW').length,
        overdue: overdue.length,
      };
    })
    .sort((a, b) => (a.highlight[0]?.scheduledAt ?? '9').localeCompare(b.highlight[0]?.scheduledAt ?? '9'));
});

const expanded = reactive<Record<string, boolean>>({});
</script>

<template>
  <section class="space-y-8">
    <!-- Agenda -->
    <div>
      <h1 class="mb-4 text-lg font-semibold text-body">Minha Agenda</h1>
      <p v-if="agenda.isLoading.value" class="text-sm text-muted">Carregando agenda…</p>
      <p v-if="agenda.data.value && agenda.data.value.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        Nenhuma sessão na sua agenda.
      </p>
      <ul class="space-y-3">
        <li v-for="p in byPatient" :key="p.patientId" class="rounded-lg border border-border bg-surface p-4 shadow-sm">
          <!-- Cabeçalho do paciente -->
          <div class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div class="min-w-0">
              <p class="text-sm font-semibold text-body">
                Paciente
                <NuxtLink :to="`/prontuario/${p.patientId}`" class="font-mono text-link hover:underline">
                  {{ p.patientCode ?? '—' }}
                </NuxtLink>
              </p>
              <p class="text-xs text-muted">
                <template v-if="p.weekly">{{ p.weekly }} · </template>{{ p.roomName ?? 'Sala não definida' }}
              </p>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span v-if="p.overdue > 0" class="pill pill-warn">{{ p.overdue }} sem presença</span>
              <span class="pill pill-ok">{{ p.attended }} realizada(s)</span>
              <span v-if="p.noShow > 0" class="pill pill-muted">{{ p.noShow }} falta(s)</span>
            </div>
          </div>

          <!-- Sessões: em destaque (pendentes + próxima) ou todas -->
          <p v-if="p.highlight.length === 0 && !expanded[p.patientId]" class="mt-3 border-t border-border pt-3 text-xs text-muted">
            Nenhuma sessão futura agendada.
          </p>
          <div
            v-for="appt in expanded[p.patientId] ? [...p.highlight, ...p.rest].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)) : p.highlight"
            :key="appt.id"
            class="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm text-body">{{ formatDateTime(appt.scheduledAt) }}</span>
              <span v-if="appt.roomName && appt.roomName !== p.roomName" class="text-xs text-muted">· {{ appt.roomName }}</span>
              <span class="pill" :class="STATUS_PILL[appt.status]">{{ STATUS_LABEL[appt.status] }}</span>
            </div>
            <div v-if="appt.status === 'SCHEDULED'" class="flex gap-2">
              <button
                :disabled="attendance.isPending.value"
                class="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60 sm:flex-none sm:py-1.5"
                @click="attendance.mutate({ id: appt.id, outcome: 'ATTENDED' })"
              >
                Compareceu
              </button>
              <button
                :disabled="attendance.isPending.value"
                class="flex-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-body hover:bg-surface2 disabled:opacity-60 sm:flex-none sm:py-1.5"
                @click="attendance.mutate({ id: appt.id, outcome: 'NO_SHOW' })"
              >
                Faltou
              </button>
            </div>
          </div>

          <button
            v-if="p.rest.length > 0"
            type="button"
            class="mt-3 text-xs font-medium text-link hover:underline"
            @click="expanded[p.patientId] = !expanded[p.patientId]"
          >
            {{ expanded[p.patientId] ? 'Mostrar só as pendentes e a próxima' : `Ver todas as sessões (${p.rest.length + p.highlight.length})` }}
          </button>
        </li>
      </ul>
    </div>

    <!-- Meus pacientes -->
    <div>
      <div class="mb-4">
        <h2 class="text-lg font-semibold text-body">Meus pacientes</h2>
        <p class="text-xs text-muted">Abra o paciente para preencher os documentos dele.</p>
      </div>
      <p v-if="patients.data.value && patients.data.value.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        Você ainda não tem pacientes vinculados.
      </p>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="p in patients.data.value" :key="p.id">
          <NuxtLink
            :to="`/prontuario/${p.id}`"
            class="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link"
          >
            <div class="min-w-0">
              <p class="truncate font-mono text-sm font-medium text-body">{{ patientDisplayName(p, user?.role) }}</p>
              <p class="text-xs text-muted">{{ p.isMinor ? 'Menor de idade' : 'Adulto' }}</p>
            </div>
            <span class="pill pill-muted shrink-0">{{ countFor(p.id) }} relatório(s)</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
