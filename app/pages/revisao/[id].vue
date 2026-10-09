<script setup lang="ts">
import { useReviewDoc, useTransition } from '../../composables/useDocuments';
import { getAt, stepsFor } from '../../shared/screening/fields';
import { apiErrorCode } from '../../shared/api/error-code';
import type { ScreeningType } from '../../composables/useScreenings';

definePageMeta({ layout: 'authenticated', middleware: 'require-role', roles: ['SUPERVISOR'] });

// Tela de revisão do supervisor: lê o documento, comenta e decide
// (aprovar/ajustes/rejeitar). Equivalente a
// features/documents/pages/ReviewDocument.tsx.
const route = useRoute();
const id = computed(() => route.params.id as string);
const query = useReviewDoc(id);
const transition = useTransition();
const comment = ref('');

// Os relatórios linkam para cá documentos fora da fila (aprovados,
// rejeitados…): para esses a tela é só leitura — a máquina de estados
// recusaria qualquer decisão.
const REVIEWABLE = new Set(['ENVIADO_PARA_SUPERVISAO', 'EM_REVISAO']);
const reviewable = computed(() => !!query.data.value && REVIEWABLE.has(query.data.value.status));

const steps = computed(() => (query.data.value ? stepsFor(query.data.value.type as ScreeningType) : []));

function act(action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT') {
  if ((action === 'REQUEST_CHANGES' || action === 'REJECT') && !comment.value.trim()) return;
  transition.mutate(
    { id: id.value, action, comment: comment.value.trim() || undefined },
    { onSuccess: () => navigateTo('/revisao') },
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <p v-if="query.isLoading.value" class="text-sm text-muted">Carregando documento…</p>
  <p v-else-if="query.isError.value || !query.data.value" class="text-sm text-danger">Documento não encontrado.</p>
  <div v-else class="mx-auto max-w-3xl space-y-6">
    <NuxtLink to="/revisao" class="inline-block text-sm font-medium text-link hover:underline">← Voltar à fila de revisão</NuxtLink>
    <div class="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <span class="text-sm font-bold text-muted">Nº {{ query.data.value.patientCode }}</span>
        <span class="pill pill-info">{{ query.data.value.status }}</span>
      </div>
      <p class="mb-4 text-sm text-muted">Estagiário: {{ query.data.value.authorName }}</p>

      <!-- Conteúdo (somente leitura) -->
      <div class="space-y-5">
        <div v-for="s in steps" :key="s.id">
          <h3 class="mb-2 text-sm font-bold text-link">{{ s.label }}</h3>
          <div class="space-y-3">
            <div v-for="f in s.fields" :key="f.path">
              <p class="text-xs font-semibold text-muted">{{ f.label }}</p>
              <p class="whitespace-pre-wrap text-sm text-body">
                <template v-if="getAt(query.data.value.content, f.path)">{{ getAt(query.data.value.content, f.path) }}</template>
                <span v-else class="text-muted">—</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <SignaturesPanel :signatures="query.data.value.signatures" />

    <!-- Comentários anteriores -->
    <div v-if="query.data.value.comments.length > 0" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h3 class="mb-2 text-sm font-semibold text-body">Comentários</h3>
      <ul class="space-y-2">
        <li v-for="c in query.data.value.comments" :key="c.id" class="border-l-2 border-link bg-surface2 px-3 py-2 text-sm">
          <span class="font-semibold text-body">{{ c.reviewerName }}</span>
          <span class="text-muted"> · {{ formatDateTime(c.createdAt) }}</span>
          <p class="text-body">{{ c.body }}</p>
        </li>
      </ul>
    </div>

    <p v-if="!reviewable" class="rounded-lg border border-border bg-surface2 p-4 text-sm text-muted">
      Este documento não está aguardando revisão — somente leitura.
    </p>

    <!-- Decisão -->
    <div v-else class="rounded-lg border border-border bg-surface p-5 shadow-sm">
      <h3 class="mb-2 text-sm font-semibold text-body">Parecer do supervisor</h3>
      <textarea
        v-model="comment"
        class="mb-3 min-h-20 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
        placeholder="Comentário (obrigatório para solicitar ajustes ou rejeitar)"
      />
      <p v-if="transition.isError.value" class="mb-3 text-sm text-danger">
        {{
          apiErrorCode(transition.error.value) === 'forbidden'
            ? 'Você não supervisiona este paciente.'
            : 'Não foi possível registrar o parecer. Atualize a página e tente novamente.'
        }}
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          :disabled="transition.isPending.value"
          class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          @click="act('APPROVE')"
        >
          Aprovar e assinar
        </button>
        <button
          :disabled="transition.isPending.value || !comment.trim()"
          class="rounded-md border border-border px-4 py-2 text-sm font-medium text-body hover:bg-surface2 disabled:opacity-50"
          @click="act('REQUEST_CHANGES')"
        >
          Solicitar ajustes
        </button>
        <button
          :disabled="transition.isPending.value || !comment.trim()"
          class="rounded-md px-4 py-2 text-sm font-medium text-danger hover:bg-surface2 disabled:opacity-50"
          @click="act('REJECT')"
        >
          Rejeitar
        </button>
      </div>
    </div>
  </div>
</template>
