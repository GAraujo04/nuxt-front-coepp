<script setup lang="ts">
import { useAgenda, useRegisterAttendance } from '../../composables/useAgenda';
import { usePatients } from '../../composables/usePatients';
import { useScreenings } from '../../composables/useScreenings';
import type { AppointmentStatus } from '../../composables/useAgenda';

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
      <ul class="space-y-2">
        <li
          v-for="appt in agenda.data.value"
          :key="appt.id"
          class="flex items-center justify-between rounded-lg border border-border bg-surface p-4 shadow-sm"
        >
          <div>
            <p class="text-sm font-medium text-body">
              {{ formatDateTime(appt.scheduledAt) }}
              <span v-if="appt.roomName" class="ml-2 font-normal text-muted">· {{ appt.roomName }}</span>
            </p>
            <p v-if="!appt.roomName" class="text-xs text-muted">Sala não definida</p>
            <span class="pill mt-1" :class="STATUS_PILL[appt.status]">{{ STATUS_LABEL[appt.status] }}</span>
          </div>
          <div v-if="appt.status === 'SCHEDULED'" class="flex gap-2">
            <button
              :disabled="attendance.isPending.value"
              class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
              @click="attendance.mutate({ id: appt.id, outcome: 'ATTENDED' })"
            >
              Compareceu
            </button>
            <button
              :disabled="attendance.isPending.value"
              class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-body hover:bg-surface2 disabled:opacity-60"
              @click="attendance.mutate({ id: appt.id, outcome: 'NO_SHOW' })"
            >
              Faltou
            </button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Meus pacientes -->
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-body">Meus pacientes</h2>
        <NuxtLink to="/triagem/nova" class="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-onprimary hover:bg-primaryh">
          + Nova triagem
        </NuxtLink>
      </div>
      <p v-if="patients.data.value && patients.data.value.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        Você ainda não tem pacientes vinculados.
      </p>
      <ul class="grid gap-2 sm:grid-cols-2">
        <li v-for="p in patients.data.value" :key="p.id">
          <NuxtLink
            :to="`/prontuario/${p.id}`"
            class="flex items-center justify-between rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link"
          >
            <div>
              <p class="text-sm font-medium text-body">{{ p.fullName }}</p>
              <p class="text-xs text-muted">{{ p.isMinor ? 'Menor de idade' : 'Adulto' }}</p>
            </div>
            <span class="pill pill-muted">{{ countFor(p.id) }} relatório(s)</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </section>
</template>
