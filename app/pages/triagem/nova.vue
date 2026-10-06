<script setup lang="ts">
import { usePatients } from '../../composables/usePatients';
import { useAuth } from '../../composables/useAuth';
import { useCreateScreening, useScreenings } from '../../composables/useScreenings';
import type { ScreeningType } from '../../composables/useScreenings';
import { DOC_TYPE_LABEL, initialContentFor } from '../../shared/screening/fields';
import { patientDisplayName } from '../../shared/lib/patient-display';
import { apiErrorCode } from '../../shared/api/error-code';

definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// Início de um documento: cria o rascunho e abre o wizard.
// Equivalente a features/screening/pages/NewScreeningPage.tsx.
//
// O paciente vem por query string quando a criação parte do prontuário
// (`?patientId=…`), que é o caminho normal: o estagiário JÁ escolheu o
// paciente ao abrir o prontuário, e pedir de novo num select era um passo
// redundante — e uma chance de escolher o paciente errado. O select só
// aparece quando a página é aberta solta, sem paciente no contexto.
const SCREENING_TYPES: ScreeningType[] = ['SCREENING_ADULT', 'SCREENING_CHILD'];

const route = useRoute();
const { user } = useAuth();
const patients = usePatients();
const screenings = useScreenings();
const create = useCreateScreening();

const patientIdFromRoute = computed(() => (route.query.patientId as string | undefined) ?? '');
const typeFromRoute = computed(() => route.query.type as ScreeningType | undefined);

const patientId = ref(patientIdFromRoute.value);
const type = ref<ScreeningType>(typeFromRoute.value ?? 'SCREENING_ADULT');

const lockedPatient = computed(() =>
  patientIdFromRoute.value ? patients.data.value?.find((p) => p.id === patientIdFromRoute.value) : undefined,
);

// Um documento de cada por paciente. Esta tela é alcançável por URL direta,
// então a checagem fica aqui e não só no prontuário: se o paciente
// escolhido já tem uma triagem, abre a que existe em vez de criar a segunda.
const existingScreening = computed(() =>
  screenings.data.value?.find(
    (s) => s.patientId === patientId.value && (s.type === 'SCREENING_ADULT' || s.type === 'SCREENING_CHILD'),
  ),
);
// A triagem é única por paciente, e o backend é quem garante: a triagem de
// OUTRO estagiário não aparece em `screenings` (RLS), então só o 409 da
// criação revela que ela existe.
const screeningTaken = computed(() => create.isError.value && apiErrorCode(create.error.value) === 'conflict');

// Só as triagens deixam escolher a variante na tela (Adulto / Criança). Os
// documentos de estágio chegam com o tipo já definido pelo botão do prontuário.
const choosingScreeningType = computed(() => !typeFromRoute.value);

function onSubmit() {
  if (!patientId.value) return;
  const existing = existingScreening.value;
  if (existing) return navigateTo(`/triagem/${existing.id}`);

  const patient = patients.data.value?.find((p) => p.id === patientId.value);
  create.mutate(
    {
      type: type.value,
      patientId: patientId.value,
      // Identificação copiada do cadastro: são campos não editáveis no
      // wizard, então a criação é a única oportunidade de preenchê-los.
      content: patient
        ? initialContentFor(type.value, { fullName: patient.fullName ?? '', birthDate: patient.birthDate })
        : undefined,
    },
    { onSuccess: (s) => navigateTo(`/triagem/${s.id}`) },
  );
}

const backTo = computed(() => (patientIdFromRoute.value ? `/prontuario/${patientIdFromRoute.value}` : '/estagiario'));
</script>

<template>
  <div class="mx-auto max-w-lg">
    <NuxtLink :to="backTo" class="mb-3 inline-block text-sm font-medium text-link hover:underline">
      {{ patientIdFromRoute ? '← Voltar ao prontuário' : '← Voltar ao painel' }}
    </NuxtLink>
    <h1 class="mb-4 text-lg font-semibold text-body">
      {{ choosingScreeningType ? 'Nova triagem' : `Novo documento — ${DOC_TYPE_LABEL[type]}` }}
    </h1>
    <form class="space-y-5 rounded-lg border border-border bg-surface p-6 shadow-sm" @submit.prevent="onSubmit">
      <!-- Paciente já resolvido pelo prontuário: mostra quem é, sem pedir de novo. -->
      <div v-if="patientIdFromRoute">
        <span class="mb-1 block text-sm font-semibold text-body">Paciente</span>
        <p class="rounded-md border border-border bg-surface2 px-3 py-2 text-sm text-body">
          <span class="font-mono">{{ lockedPatient ? patientDisplayName(lockedPatient, user?.role) : 'Carregando…' }}</span>
        </p>
      </div>
      <label v-else class="block text-sm">
        <span class="mb-1 block font-semibold text-body">Paciente</span>
        <select
          v-model="patientId"
          class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
          required
        >
          <option value="">Selecione…</option>
          <option v-for="p in patients.data.value" :key="p.id" :value="p.id">
            {{ patientDisplayName(p, user?.role) }}{{ p.birthDate ? ` (${p.birthDate})` : '' }}
          </option>
        </select>
        <span v-if="patients.data.value?.length === 0" class="mt-1 block text-xs text-muted">
          Nenhum paciente vinculado a você. Peça à recepção para vincular.
        </span>
      </label>

      <div v-if="choosingScreeningType">
        <span class="mb-1 block text-sm font-semibold text-body">Tipo de triagem</span>
        <div class="flex gap-2">
          <button
            v-for="t in SCREENING_TYPES"
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

      <p v-if="existingScreening" class="rounded-md border border-border bg-surface2 p-3 text-sm text-muted">
        Este paciente já tem uma triagem. Ao continuar, você abre a que existe.
      </p>
      <p v-if="screeningTaken" class="text-sm text-danger">
        Este paciente já possui uma triagem — ela é preenchida uma única vez por paciente. Fale com o supervisor se
        precisar acessá-la.
      </p>
      <p v-else-if="create.isError.value" class="text-sm text-danger">Não foi possível criar o documento.</p>

      <button
        type="submit"
        :disabled="create.isPending.value || !patientId"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
      >
        {{ create.isPending.value ? 'Criando…' : choosingScreeningType ? 'Iniciar triagem' : 'Criar documento' }}
      </button>
    </form>
  </div>
</template>
