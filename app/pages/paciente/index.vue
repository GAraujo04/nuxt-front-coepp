<script setup lang="ts">
import { usePortal } from '../../composables/usePortal';

definePageMeta({ layout: 'authenticated', middleware: 'require-role', roles: ['PATIENT'] });

// Portal do paciente: acompanha a data/horário da sua consulta. Equivalente
// a features/portal/pages/PatientPortal.tsx. Última página da migração —
// não depende de require-profile-complete (conceito exclusivo de INTERN).
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  ATTENDED: 'Realizada',
  NO_SHOW: 'Faltou',
  CANCELLED: 'Cancelada',
};
const STATUS_PILL: Record<string, string> = {
  SCHEDULED: 'pill-info',
  ATTENDED: 'pill-ok',
  NO_SHOW: 'pill-warn',
  CANCELLED: 'pill-muted',
};

const portal = usePortal();

function formatDateTimeFull(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' });
}
function formatDateTimeShort(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <p v-if="portal.isLoading.value" class="text-sm text-muted">Carregando…</p>
  <p v-else-if="portal.isError.value || !portal.data.value" class="text-sm text-danger">Não foi possível carregar seus dados.</p>
  <section v-else class="space-y-6">
    <div>
      <h1 class="text-lg font-semibold text-body">Olá, {{ portal.data.value.fullName.split(' ')[0] }} 👋</h1>
      <p class="text-xs text-muted">Seu código de paciente: <span class="font-mono">{{ portal.data.value.code }}</span></p>
    </div>

    <div>
      <h2 class="mb-3 text-sm font-semibold text-body">Minhas consultas</h2>
      <div v-if="portal.data.value.appointments.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
        {{
          portal.data.value.pendingSlots.length > 0
            ? 'Ainda não há consulta marcada. Sua disponibilidade foi registrada e a clínica fará o agendamento.'
            : 'Você ainda não tem consultas.'
        }}
      </div>
      <ul v-else class="space-y-2">
        <li v-for="(a, i) in portal.data.value.appointments" :key="i" class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-4 shadow-sm">
          <div class="min-w-0">
            <p class="text-sm font-medium text-body">{{ formatDateTimeFull(a.scheduledAt) }}</p>
            <p class="text-sm text-body">{{ a.roomName ?? 'Sala a definir' }}</p>
            <p class="text-xs text-muted">Estagiário(a): {{ a.internName }}</p>
          </div>
          <span class="pill shrink-0" :class="STATUS_PILL[a.status] ?? 'pill-muted'">{{ STATUS_LABEL[a.status] ?? a.status }}</span>
        </li>
      </ul>
    </div>

    <div v-if="portal.data.value.pendingSlots.length > 0">
      <h2 class="mb-3 text-sm font-semibold text-body">Horários que você informou</h2>
      <ul class="flex flex-wrap gap-2">
        <li v-for="(s, i) in portal.data.value.pendingSlots" :key="i" class="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted">
          {{ formatDateTimeShort(s) }}
        </li>
      </ul>
    </div>
  </section>
</template>
