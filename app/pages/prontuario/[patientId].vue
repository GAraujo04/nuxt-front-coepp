<script setup lang="ts">
import { useCreateScreening, useScreenings } from '../../composables/useScreenings';
import { usePatients } from '../../composables/usePatients';
import type { Screening, ScreeningType } from '../../composables/useScreenings';
import { DOC_TYPE_LABEL, initialContentFor, PATIENT_DOC_SLOTS } from '../../shared/screening/fields';
import type { DocSlot } from '../../shared/screening/fields';

definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// Prontuário do paciente (visão do estagiário): os sete documentos daquele
// paciente. Equivalente a features/patients/pages/PatientRecordPage.tsx.
//
// A tela lista os SLOTS (sempre os sete, fixos), não os documentos que já
// existem: cada paciente tem um documento de cada, então a lista não cresce
// — ela começa toda "Não iniciado" e vai mudando de status. Um documento é
// criado no primeiro clique, não por um botão "+ novo" à parte.
const STATUS_LABEL: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADO_PARA_SUPERVISAO: 'Enviado para aprovação',
  EM_REVISAO: 'Em revisão',
  REVISAO_SOLICITADA: 'Ajustes solicitados',
  REJEITADO: 'Rejeitado',
  APROVADO_LOCKED: 'Aprovado',
};
const DOC_PILL: Record<string, string> = {
  RASCUNHO: 'pill-muted',
  ENVIADO_PARA_SUPERVISAO: 'pill-info',
  EM_REVISAO: 'pill-info',
  REVISAO_SOLICITADA: 'pill-warn',
  REJEITADO: 'pill-danger',
  APROVADO_LOCKED: 'pill-ok',
};
const DISABILITY_LABEL: Record<string, string> = {
  FISICA: 'Física',
  VISUAL: 'Visual',
  AUDITIVA: 'Auditiva',
  INTELECTUAL: 'Intelectual',
  PSICOSSOCIAL: 'Psicossocial',
  MULTIPLA: 'Múltipla',
  OUTRA: 'Outra',
};

const route = useRoute();
const patientId = computed(() => route.params.patientId as string);
const patients = usePatients();
const screenings = useScreenings();
const create = useCreateScreening();
const opening = ref<string | null>(null);

const patient = computed(() => patients.data.value?.find((p) => p.id === patientId.value));
const docs = computed(() => screenings.data.value?.filter((s) => s.patientId === patientId.value) ?? []);

/** Documento que ocupa o slot, se já foi iniciado. */
function docOf(slot: DocSlot): Screening | undefined {
  return docs.value.find((d) => slot.types.includes(d.type));
}

// Documentos do paciente que não couberam em nenhum slot — na prática, um
// segundo documento do mesmo tipo criado antes desta tela existir. Ficam
// visíveis de propósito: esconder um documento clínico ao qual não há mais
// nenhum outro caminho seria pior do que mostrar uma linha a mais.
const extras = computed(() => {
  const emSlot = new Set(PATIENT_DOC_SLOTS.map((s) => docOf(s)?.id).filter(Boolean));
  return docs.value.filter((d) => !emSlot.has(d.id));
});

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

async function openSlot(slot: DocSlot) {
  const existing = docOf(slot);
  if (existing) return navigateTo(`/triagem/${existing.id}`);

  // Mais de um tipo possível (a triagem): a escolha Adulto/Criança precisa
  // ser feita antes de criar, então passa pela tela de criação — com o
  // paciente já resolvido.
  if (slot.types.length > 1) return navigateTo(`/triagem/nova?patientId=${patientId.value}`);

  const type = slot.types[0] as ScreeningType;
  opening.value = slot.id;
  try {
    const created = await create.mutateAsync({
      type,
      patientId: patientId.value,
      content: patient.value
        ? initialContentFor(type, { fullName: patient.value.fullName, birthDate: patient.value.birthDate })
        : undefined,
    });
    await navigateTo(`/triagem/${created.id}`);
  } finally {
    opening.value = null;
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <NuxtLink to="/estagiario" class="mb-3 inline-block text-sm font-medium text-link hover:underline">← Voltar aos meus pacientes</NuxtLink>

    <div class="mb-5">
      <h1 class="text-lg font-semibold text-body">Prontuário — {{ patient?.fullName ?? '…' }}</h1>
      <p v-if="patient?.code" class="text-xs text-muted">Código: <span class="font-mono">{{ patient.code }}</span></p>
      <p v-if="patient?.birthDate" class="text-xs text-muted">Nascimento: {{ patient.birthDate }}</p>
      <p v-if="patient?.hasDisability" class="text-xs text-muted">
        Deficiência:
        {{ patient.disabilities.map((d) => (d.type === 'OUTRA' ? d.otherText ?? 'Outra' : DISABILITY_LABEL[d.type] ?? d.type)).join(', ') }}
      </p>
    </div>

    <p v-if="create.isError.value" class="mb-3 text-sm text-danger">
      Não foi possível abrir o documento. Tente novamente.
    </p>

    <h2 class="mb-2 text-sm font-semibold text-body">Documentos</h2>
    <ul class="space-y-2">
      <li v-for="slot in PATIENT_DOC_SLOTS" :key="slot.id">
        <button
          class="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-sm hover:border-link disabled:opacity-60"
          :disabled="opening === slot.id"
          @click="openSlot(slot)"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium text-body">
              {{ docOf(slot) ? DOC_TYPE_LABEL[docOf(slot)!.type] : slot.label }}
              <span v-if="docOf(slot) && patient?.code" class="ml-2 font-mono text-xs text-muted">Nº {{ patient.code }}</span>
            </span>
            <span class="block text-xs text-muted">
              {{
                opening === slot.id
                  ? 'Abrindo…'
                  : docOf(slot)
                    ? `Atualizado em ${formatDateTime(docOf(slot)!.updatedAt)}`
                    : 'Clique para começar'
              }}
            </span>
          </span>
          <span v-if="docOf(slot)" class="pill shrink-0" :class="DOC_PILL[docOf(slot)!.status] ?? 'pill-muted'">
            {{ STATUS_LABEL[docOf(slot)!.status] ?? docOf(slot)!.status }}
          </span>
          <span v-else class="pill pill-muted shrink-0">Não iniciado</span>
        </button>
      </li>
    </ul>

    <template v-if="extras.length > 0">
      <h2 class="mb-2 mt-6 text-sm font-semibold text-body">Outros documentos</h2>
      <p class="mb-2 text-xs text-muted">
        Documentos duplicados deste paciente, criados antes de a lista fixa existir.
      </p>
      <ul class="space-y-2">
        <li v-for="d in extras" :key="d.id">
          <NuxtLink
            :to="`/triagem/${d.id}`"
            class="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link"
          >
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-medium text-body">
                {{ DOC_TYPE_LABEL[d.type] ?? d.type }}
                <span class="ml-2 font-mono text-xs text-muted">Nº {{ patient?.code ?? '—' }}</span>
              </span>
              <span class="block text-xs text-muted">Atualizado em {{ formatDateTime(d.updatedAt) }}</span>
            </span>
            <span class="pill shrink-0" :class="DOC_PILL[d.status] ?? 'pill-muted'">
              {{ STATUS_LABEL[d.status] ?? d.status }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </template>
  </div>
</template>
