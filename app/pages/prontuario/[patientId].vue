<script setup lang="ts">
import { useDeleteScreening, useScreenings } from '../../composables/useScreenings';
import { usePatients } from '../../composables/usePatients';
import type { Screening } from '../../composables/useScreenings';

definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// Prontuário do paciente (visão do estagiário): todos os relatórios daquele
// paciente. Equivalente a features/patients/pages/PatientRecordPage.tsx.
const TYPE_LABEL: Record<string, string> = {
  SCREENING_ADULT: 'Triagem — Adulto',
  SCREENING_CHILD: 'Triagem — Criança/Adolescente',
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
const { user } = useAuth();
const patients = usePatients();
const screenings = useScreenings();
const deleteScreening = useDeleteScreening();
const confirmingId = ref<string | null>(null);

const patient = computed(() => patients.data.value?.find((p) => p.id === patientId.value));
const docs = computed(() => screenings.data.value?.filter((s) => s.patientId === patientId.value) ?? []);

// Remover só aparece pra rascunho do próprio autor/coautor — depois de
// enviado pra supervisão, não pode mais ser deletado (nem pelo autor).
function canDelete(s: Screening) {
  return s.status === 'RASCUNHO' && !!user.value && (s.authorId === user.value.id || s.coAuthorIds.includes(user.value.id));
}

function handleDelete(id: string) {
  confirmingId.value = null;
  deleteScreening.mutate(id);
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <NuxtLink to="/estagiario" class="mb-3 inline-block text-sm font-medium text-link hover:underline">← Voltar aos meus pacientes</NuxtLink>

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-lg font-semibold text-body">Prontuário — {{ patient?.fullName ?? '…' }}</h1>
        <p v-if="patient?.code" class="text-xs text-muted">Código: <span class="font-mono">{{ patient.code }}</span></p>
        <p v-if="patient?.birthDate" class="text-xs text-muted">Nascimento: {{ patient.birthDate }}</p>
        <p v-if="patient?.hasDisability" class="text-xs text-muted">
          Deficiência:
          {{ patient.disabilities.map((d) => (d.type === 'OUTRA' ? d.otherText ?? 'Outra' : DISABILITY_LABEL[d.type] ?? d.type)).join(', ') }}
        </p>
      </div>
      <NuxtLink to="/triagem/nova" class="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-onprimary hover:bg-primaryh">+ Nova triagem</NuxtLink>
    </div>

    <p v-if="deleteScreening.isError.value" class="mb-3 text-sm text-danger">
      Não foi possível remover o documento. Se já foi enviado para supervisão, ele não pode mais ser removido.
    </p>

    <p v-if="docs.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      Nenhum relatório para este paciente ainda.
    </p>
    <ul v-else class="space-y-2">
      <li
        v-for="s in docs"
        :key="s.id"
        class="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link"
      >
        <NuxtLink :to="`/triagem/${s.id}`" class="min-w-0 flex-1">
          <p class="text-sm font-medium text-body">
            {{ TYPE_LABEL[s.type] ?? s.type }}
            <span class="ml-2 font-mono text-xs text-muted">Nº {{ s.numero ?? '—' }}</span>
          </p>
          <p class="text-xs text-muted">Atualizado em {{ formatDateTime(s.updatedAt) }}</p>
        </NuxtLink>

        <div class="flex shrink-0 items-center gap-2">
          <span class="pill" :class="DOC_PILL[s.status] ?? 'pill-muted'">{{ s.status }}</span>

          <template v-if="canDelete(s)">
            <span v-if="confirmingId === s.id" class="flex items-center gap-1 text-xs">
              <span class="text-muted">Remover?</span>
              <button
                :disabled="deleteScreening.isPending.value"
                class="rounded-md border border-danger px-2 py-1 font-medium text-danger hover:bg-surface2 disabled:opacity-50"
                @click="handleDelete(s.id)"
              >
                Confirmar
              </button>
              <button class="rounded-md border border-border px-2 py-1 font-medium text-body hover:bg-surface2" @click="confirmingId = null">
                Cancelar
              </button>
            </span>
            <button
              v-else
              class="rounded-md border border-border px-2 py-1 text-xs font-medium text-danger hover:bg-surface2"
              @click="confirmingId = s.id"
            >
              Remover
            </button>
          </template>
        </div>
      </li>
    </ul>
  </div>
</template>
