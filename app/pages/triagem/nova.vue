<script setup lang="ts">
import { usePatients } from '../../composables/usePatients';
import { useCreateScreening } from '../../composables/useScreenings';
import type { ScreeningType } from '../../composables/useScreenings';

definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// Início de uma triagem: escolher paciente e tipo; cria o rascunho e abre o
// wizard. Equivalente a features/screening/pages/NewScreeningPage.tsx.
const patients = usePatients();
const create = useCreateScreening();
const patientId = ref('');
const type = ref<ScreeningType>('SCREENING_ADULT');

function onSubmit() {
  if (!patientId.value) return;
  create.mutate(
    { type: type.value, patientId: patientId.value },
    { onSuccess: (s) => navigateTo(`/triagem/${s.id}`) },
  );
}
</script>

<template>
  <div class="mx-auto max-w-lg">
    <NuxtLink to="/estagiario" class="mb-3 inline-block text-sm font-medium text-link hover:underline">← Voltar ao painel</NuxtLink>
    <h1 class="mb-4 text-lg font-semibold text-body">Nova triagem</h1>
    <form class="space-y-5 rounded-lg border border-border bg-surface p-6 shadow-sm" @submit.prevent="onSubmit">
      <label class="block text-sm">
        <span class="mb-1 block font-semibold text-body">Paciente</span>
        <select
          v-model="patientId"
          class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
          required
        >
          <option value="">Selecione…</option>
          <option v-for="p in patients.data.value" :key="p.id" :value="p.id">
            {{ p.fullName }}{{ p.birthDate ? ` (${p.birthDate})` : '' }}
          </option>
        </select>
        <span v-if="patients.data.value?.length === 0" class="mt-1 block text-xs text-muted">
          Nenhum paciente vinculado a você. Peça à recepção para vincular.
        </span>
      </label>

      <div>
        <span class="mb-1 block text-sm font-semibold text-body">Tipo de triagem</span>
        <div class="flex gap-2">
          <button
            v-for="t in (['SCREENING_ADULT', 'SCREENING_CHILD'] as ScreeningType[])"
            :key="t"
            type="button"
            class="rounded-md px-3 py-1.5 text-sm font-medium"
            :class="type === t ? 'bg-primary text-onprimary' : 'border border-border text-body'"
            @click="type = t"
          >
            {{ t === 'SCREENING_ADULT' ? 'Adulto' : 'Criança/Adolescente' }}
          </button>
        </div>
      </div>

      <p v-if="create.isError.value" class="text-sm text-danger">Não foi possível criar a triagem.</p>

      <button
        type="submit"
        :disabled="create.isPending.value || !patientId"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
      >
        {{ create.isPending.value ? 'Criando…' : 'Iniciar triagem' }}
      </button>
    </form>
  </div>
</template>
