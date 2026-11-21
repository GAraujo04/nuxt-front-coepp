<script setup lang="ts">
import { useAttendancePeriod, useSetAttendancePeriod } from '../composables/useAttendancePeriod';

// Painel Admin: período de atendimentos do ciclo. Com ele configurado,
// todo pareamento novo já sai com as consultas semanais (mesmo dia e
// horário) até o fim do período. Salvar o período também completa a agenda
// dos pares que já existiam (antes era um botão à parte, "Gerar agenda").
const period = useAttendancePeriod();
const save = useSetAttendancePeriod();
const form = reactive({ startDate: '', endDate: '' });

watch(
  period.data,
  (p) => {
    if (p) Object.assign(form, p);
  },
  { immediate: true },
);

const invalid = computed(() => !form.startDate || !form.endDate || form.endDate < form.startDate);
const inputClass =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <h2 class="mb-1 text-lg font-semibold text-body">Período de atendimentos</h2>
      <p class="mb-4 text-sm text-muted">
        Defina quando os atendimentos do ciclo começam e terminam. Cada par paciente–estagiário é atendido toda semana
        no mesmo dia e horário do pareamento, até a data de fim. Ao salvar, os pares que já existem ganham as semanas que
        faltam.
      </p>
      <p v-if="period.data.value" class="mb-3 text-sm text-body">
        Vigente: <strong>{{ formatDate(period.data.value.startDate) }}</strong> a
        <strong>{{ formatDate(period.data.value.endDate) }}</strong>
      </p>
      <p v-else-if="period.isSuccess.value" class="mb-3 text-sm text-muted">
        Nenhum período configurado — o pareamento agenda só a primeira consulta.
      </p>

      <form class="flex max-w-2xl flex-wrap items-end gap-3" @submit.prevent="save.mutate({ ...form })">
        <label class="block text-sm">
          <span class="mb-1 block font-medium text-body">Início</span>
          <input v-model="form.startDate" type="date" :class="inputClass" :max="form.endDate || undefined" required>
        </label>
        <label class="block text-sm">
          <span class="mb-1 block font-medium text-body">Fim</span>
          <input v-model="form.endDate" type="date" :class="inputClass" :min="form.startDate || undefined" required>
        </label>
        <button
          type="submit"
          :disabled="save.isPending.value || invalid"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
        >
          {{ save.isPending.value ? 'Salvando…' : 'Salvar período' }}
        </button>
      </form>
      <p v-if="save.isError.value" class="mt-2 text-sm text-danger">
        Não foi possível salvar. O fim deve ser igual ou posterior ao início, e o período pode ter no máximo um ano.
      </p>
      <p v-else-if="save.data.value" class="mt-2 text-sm text-ok">
        Período salvo.
        <span v-if="save.data.value.series.created > 0" class="text-body">
          {{ save.data.value.series.created }} consulta(s) agendada(s) para os pares já existentes.
        </span>
      </p>
      <template v-if="save.data.value && !save.isError.value">
        <p v-if="save.data.value.series.pairsWithoutAnchor > 0" class="mt-1 text-sm text-muted">
          {{ save.data.value.series.pairsWithoutAnchor }} vínculo(s) sem nenhuma consulta ficaram sem agenda — faça o
          pareamento manual deles.
        </p>
        <p v-if="save.data.value.series.created > 0" class="mt-1 text-sm text-muted">
          Semanas em que a sala do par já estava ocupada ficaram sem sala; realoque-as na aba Salas.
        </p>
      </template>
    </div>
  </section>
</template>
