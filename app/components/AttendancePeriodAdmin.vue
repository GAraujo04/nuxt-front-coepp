<script setup lang="ts">
import { useAttendancePeriod, useGenerateSeries, useSetAttendancePeriod } from '../composables/useAttendancePeriod';

// Painel Admin: período de atendimentos do ciclo. Com ele configurado,
// todo pareamento novo já sai com as consultas semanais (mesmo dia e
// horário) até o fim do período. "Gerar agenda" aplica o mesmo aos pares
// que já existiam — pode ser repetido sem duplicar consultas.
const period = useAttendancePeriod();
const save = useSetAttendancePeriod();
const generate = useGenerateSeries();
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
        no mesmo dia e horário do pareamento, até a data de fim.
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
      <p v-else-if="save.isSuccess.value" class="mt-2 text-sm text-ok">Período salvo.</p>
    </div>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h3 class="mb-1 text-sm font-semibold text-body">Gerar agenda dos pares existentes</h3>
      <p class="mb-3 text-xs text-muted">
        Pareamentos feitos antes de configurar o período têm só a primeira consulta. Isto agenda as semanas seguintes
        até o fim do período, no horário de cada par. Pode ser repetido: datas já agendadas são puladas.
      </p>
      <button
        :disabled="generate.isPending.value || !period.data.value"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
        @click="generate.mutate()"
      >
        {{ generate.isPending.value ? 'Gerando…' : 'Gerar agenda do período' }}
      </button>
      <p v-if="generate.isError.value" class="mt-2 text-sm text-danger">Não foi possível gerar a agenda.</p>
      <p v-else-if="generate.data.value" class="mt-2 text-sm text-body">
        {{ generate.data.value.created }} consulta(s) agendada(s) para {{ generate.data.value.pairs }} vínculo(s).
        <span v-if="generate.data.value.pairsWithoutAnchor > 0" class="text-muted">
          {{ generate.data.value.pairsWithoutAnchor }} vínculo(s) sem nenhuma consulta ficaram de fora — faça o
          pareamento manual deles primeiro.
        </span>
        <span v-if="generate.data.value.created > 0" class="text-muted">
          Consultas em semanas com a sala ocupada ficaram sem sala; realoque-as na aba Salas.
        </span>
      </p>
    </div>
  </section>
</template>
