<script setup lang="ts">
import { useCreateDisciplina, useDisciplinas } from '../composables/useDisciplinas';

// Painel Admin: cadastra e lista as disciplinas do estágio (usadas no
// cadastro do aluno). Equivalente a features/disciplinas/pages/DisciplinasAdmin.tsx.
const list = useDisciplinas();
const create = useCreateDisciplina();
const name = ref('');

function onSubmit() {
  if (name.value.trim()) create.mutate(name.value.trim(), { onSuccess: () => (name.value = '') });
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <h2 class="mb-4 text-lg font-semibold text-body">Disciplinas</h2>
      <form class="flex max-w-xl gap-2" @submit.prevent="onSubmit">
        <input
          v-model="name"
          class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
          placeholder="Nome da disciplina (ex.: Estágio Supervisionado I)"
        >
        <button
          type="submit"
          :disabled="create.isPending.value || !name.trim()"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
        >
          Adicionar
        </button>
      </form>
      <p v-if="create.isError.value" class="mt-2 text-sm text-danger">Não foi possível adicionar (nome já existe?).</p>
    </div>

    <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h3 class="mb-3 text-sm font-semibold text-body">Cadastradas ({{ list.data.value?.length ?? 0 }})</h3>
      <ul class="space-y-1 text-sm">
        <li v-for="d in list.data.value" :key="d.id" class="border-b border-border py-1.5 text-body last:border-0">{{ d.name }}</li>
        <li v-if="list.data.value && list.data.value.length === 0" class="text-muted">Nenhuma disciplina cadastrada.</li>
      </ul>
    </div>
  </section>
</template>
