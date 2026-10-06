<script setup lang="ts">
import type { AvailabilityWindowValue } from '../../components/WeeklyAvailabilityPicker.vue';
import {
  useAvailabilityLock,
  useMyAvailabilityWindows,
  useRequestAvailabilityChange,
  useUpdateAvailabilityWindows,
} from '../../composables/useEnrollment';

// Primeira página a usar os dois middlewares juntos + o layout authenticated
// (navbar). require-profile-complete faz sentido aqui (diferente de
// completar-cadastro.vue): só estagiário com cadastro já completo tem
// "disponibilidade recorrente" pra editar.
definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// A disponibilidade fica TRAVADA por padrão: mudá-la desfaz horários já
// combinados com pacientes. O estagiário pede a mudança, o supervisor
// libera por um prazo, e a liberação vale para um salvamento — depois
// trava de novo. Quem garante é o backend (PUT devolve 403 travado); a
// tela só reflete o estado.
const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const current = useMyAvailabilityWindows();
const lock = useAvailabilityLock();
const update = useUpdateAvailabilityWindows();
const requestChange = useRequestAvailabilityChange();
const windows = ref<AvailabilityWindowValue[]>([]);
const saved = ref(false);
const reason = ref('');

watch(
  current.data,
  (data) => {
    if (data) windows.value = data;
  },
  { immediate: true },
);

const editable = computed(() => lock.data.value?.editable ?? false);
const requestedAt = computed(() => lock.data.value?.requestedAt ?? null);
const pending = computed(() => !editable.value && !!requestedAt.value);

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function onSubmit() {
  saved.value = false;
  update.mutate(windows.value, { onSuccess: () => (saved.value = true) });
}

function onRequest() {
  if (reason.value.trim()) requestChange.mutate(reason.value.trim(), { onSuccess: () => (reason.value = '') });
}
</script>

<template>
  <p v-if="current.isLoading.value || lock.isLoading.value" class="text-sm text-muted">Carregando…</p>
  <p v-else-if="current.isError.value || lock.isError.value" class="text-sm text-danger">
    Não foi possível carregar sua disponibilidade.
  </p>
  <div v-else class="mx-auto max-w-2xl">
    <h1 class="mb-1 text-lg font-semibold text-body">Minha disponibilidade</h1>
    <p class="mb-6 text-sm text-muted">
      Dias e horários em que você costuma estar disponível para atendimento. Como seus pacientes são agendados a
      partir deles, uma alteração precisa ser liberada pelo seu supervisor.
    </p>

    <!-- Liberada: edição normal, uma vez. -->
    <form v-if="editable" class="space-y-4" @submit.prevent="onSubmit">
      <p class="pill-ok rounded px-3 py-2 text-sm">
        Alteração liberada pelo supervisor
        <template v-if="lock.data.value?.unlockedUntil">até {{ formatDateTime(lock.data.value.unlockedUntil) }}</template>.
        Ao salvar, a disponibilidade volta a ficar travada.
      </p>
      <WeeklyAvailabilityPicker v-model="windows" />

      <p v-if="update.isError.value" class="pill-danger rounded px-2 py-1 text-sm">
        Não foi possível salvar. Confira se todas as janelas têm horário final depois do inicial e não se sobrepõem
        no mesmo dia.
      </p>

      <button
        type="submit"
        :disabled="update.isPending.value || windows.length === 0"
        class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
      >
        {{ update.isPending.value ? 'Salvando…' : 'Salvar' }}
      </button>
    </form>

    <!-- Travada: mostra o que vale hoje e o caminho para pedir a mudança. -->
    <div v-else class="space-y-5">
      <p v-if="saved" class="pill-ok rounded px-2 py-1 text-sm">Disponibilidade salva.</p>

      <div class="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <p class="mb-2 flex items-center gap-2 text-sm font-semibold text-body">
          <span aria-hidden="true">🔒</span> Disponibilidade atual
        </p>
        <ul v-if="windows.length > 0" class="space-y-1 text-sm text-body">
          <li v-for="(w, i) in windows" :key="i">{{ WEEKDAY_LABELS[w.weekday] }}, {{ w.startTime }} às {{ w.endTime }}</li>
        </ul>
        <p v-else class="text-sm text-muted">Nenhum horário cadastrado.</p>
      </div>

      <div v-if="pending && requestedAt" class="rounded-lg border border-border bg-surface2 p-4 text-sm text-body">
        <p class="font-semibold">Pedido enviado ao supervisor em {{ formatDateTime(requestedAt) }}.</p>
        <p class="mt-1 text-muted">Motivo: {{ lock.data.value?.requestReason }}</p>
        <p class="mt-1 text-muted">Assim que ele liberar, a edição aparece aqui.</p>
      </div>

      <form v-else class="space-y-3" @submit.prevent="onRequest">
        <label class="block text-sm">
          <span class="mb-1 block font-semibold text-body">Precisa mudar? Explique o motivo ao supervisor</span>
          <textarea
            v-model="reason"
            maxlength="500"
            class="min-h-20 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            placeholder="Ex.: mudei de turno no trabalho e não estarei mais disponível às terças pela manhã."
          />
        </label>
        <p v-if="requestChange.isError.value" class="pill-danger rounded px-2 py-1 text-sm">
          Não foi possível enviar o pedido. Tente novamente.
        </p>
        <button
          type="submit"
          :disabled="requestChange.isPending.value || !reason.trim()"
          class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        >
          {{ requestChange.isPending.value ? 'Enviando…' : 'Pedir liberação' }}
        </button>
      </form>
    </div>
  </div>
</template>
