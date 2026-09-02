<script setup lang="ts">
import type { AvailabilityWindowValue } from '../../components/WeeklyAvailabilityPicker.vue';
import { useMyAvailabilityWindows, useUpdateAvailabilityWindows } from '../../composables/useEnrollment';

// Primeira página a usar os dois middlewares juntos + o layout authenticated
// (navbar). require-profile-complete faz sentido aqui (diferente de
// completar-cadastro.vue): só estagiário com cadastro já completo tem
// "disponibilidade recorrente" pra editar.
definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// Estagiário edita a própria disponibilidade recorrente a qualquer momento
// do semestre — diferente de completar-cadastro.vue (1º acesso, só cria).
// Mesmo componente de seleção (WeeklyAvailabilityPicker), agora carregado
// com o valor atual e salvável quantas vezes forem necessárias.
const current = useMyAvailabilityWindows();
const update = useUpdateAvailabilityWindows();
const windows = ref<AvailabilityWindowValue[]>([]);
const saved = ref(false);

watch(
  current.data,
  (data) => {
    if (data) windows.value = data;
  },
  { immediate: true },
);

function onSubmit() {
  saved.value = false;
  update.mutate(windows.value, { onSuccess: () => (saved.value = true) });
}
</script>

<template>
  <p v-if="current.isLoading.value" class="text-sm text-muted">Carregando…</p>
  <p v-else-if="current.isError.value" class="text-sm text-danger">Não foi possível carregar sua disponibilidade.</p>
  <div v-else class="mx-auto max-w-2xl">
    <h1 class="mb-1 text-lg font-semibold text-body">Minha disponibilidade</h1>
    <p class="mb-6 text-sm text-muted">
      Dias e horários em que você costuma estar disponível para atendimento. Pode alterar quantas vezes precisar
      durante o semestre.
    </p>
    <form class="space-y-4" @submit.prevent="onSubmit">
      <WeeklyAvailabilityPicker v-model="windows" />

      <p v-if="update.isError.value" class="pill-danger rounded px-2 py-1 text-sm">
        Não foi possível salvar. Confira se todas as janelas têm horário final depois do inicial e não se sobrepõem
        no mesmo dia.
      </p>
      <p v-if="saved && !update.isError.value" class="pill-ok rounded px-2 py-1 text-sm">Disponibilidade salva.</p>

      <button
        type="submit"
        :disabled="update.isPending.value || windows.length === 0"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
      >
        {{ update.isPending.value ? 'Salvando…' : 'Salvar' }}
      </button>
    </form>
  </div>
</template>
