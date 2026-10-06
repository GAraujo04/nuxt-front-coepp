<script setup lang="ts">
import { useReports } from '../../composables/useDocuments';
import { DOC_TYPE_LABEL } from '../../shared/screening/fields';
import { applyReportFilters, EMPTY_REPORT_FILTERS } from '../../shared/lib/report-filters';
import type { ReportFilters } from '../../shared/lib/report-filters';

definePageMeta({ layout: 'authenticated', middleware: 'require-role', roles: ['SUPERVISOR'] });

// Relatórios do supervisor: todos os documentos já enviados pelos
// estagiários dos seus pacientes (não só os que aguardam revisão), em
// ordem de chegada por padrão, com filtros combináveis. O escopo (quais
// pacientes) vem do backend, pela RLS; os filtros rodam aqui.
const STATUS_LABEL: Record<string, string> = {
  ENVIADO_PARA_SUPERVISAO: 'Aguardando revisão',
  EM_REVISAO: 'Em revisão',
  REVISAO_SOLICITADA: 'Ajustes solicitados',
  REJEITADO: 'Rejeitado',
  APROVADO_LOCKED: 'Aprovado',
};
const STATUS_PILL: Record<string, string> = {
  ENVIADO_PARA_SUPERVISAO: 'pill-info',
  EM_REVISAO: 'pill-info',
  REVISAO_SOLICITADA: 'pill-warn',
  REJEITADO: 'pill-danger',
  APROVADO_LOCKED: 'pill-ok',
};
const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

const reports = useReports();
const filters = reactive<ReportFilters>({ ...EMPTY_REPORT_FILTERS });

// Opções do filtro de aluno saem do próprio resultado: só aparece quem
// tem documento para ver.
const authors = computed(() => {
  const seen = new Map<string, string>();
  for (const r of reports.data.value ?? []) seen.set(r.authorId, r.authorName);
  return [...seen].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
});
const filtered = computed(() => applyReportFilters(reports.data.value ?? [], filters));
const active = computed(() =>
  (Object.keys(EMPTY_REPORT_FILTERS) as (keyof ReportFilters)[]).some((k) => filters[k] !== EMPTY_REPORT_FILTERS[k]),
);

function clear() {
  Object.assign(filters, EMPTY_REPORT_FILTERS);
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <section>
    <NuxtLink to="/supervisao" class="mb-3 inline-block text-sm font-medium text-link hover:underline">← Voltar ao painel</NuxtLink>
    <h1 class="mb-4 text-lg font-semibold text-body">Relatórios</h1>

    <!-- Painel de filtros -->
    <form class="mb-5 grid gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4" @submit.prevent>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Aluno</span>
        <select v-model="filters.authorId" :class="fieldClass">
          <option value="">Todos</option>
          <option v-for="a in authors" :key="a.id" :value="a.id">{{ a.name }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Tipo de documento</span>
        <select v-model="filters.type" :class="fieldClass">
          <option value="">Todos</option>
          <option v-for="(label, t) in DOC_TYPE_LABEL" :key="t" :value="t">{{ label }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Situação</span>
        <select v-model="filters.status" :class="fieldClass">
          <option value="">Todas</option>
          <option v-for="(label, s) in STATUS_LABEL" :key="s" :value="s">{{ label }}</option>
        </select>
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Código do paciente</span>
        <input v-model="filters.patientCode" :class="fieldClass" inputmode="numeric" placeholder="Ex.: 20260003">
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Enviado de</span>
        <input v-model="filters.from" type="date" :class="fieldClass" :max="filters.to || undefined">
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">até</span>
        <input v-model="filters.to" type="date" :class="fieldClass" :min="filters.from || undefined">
      </label>
      <label class="block text-sm">
        <span class="mb-1 block font-medium text-body">Ordenar por</span>
        <select v-model="filters.order" :class="fieldClass">
          <option value="arrival">Ordem de chegada</option>
          <option value="recent">Mais recentes primeiro</option>
        </select>
      </label>
      <div class="flex items-end">
        <button
          type="button"
          :disabled="!active"
          class="rounded-md border border-border px-4 py-2 text-sm font-medium text-body hover:bg-surface2 disabled:opacity-50"
          @click="clear"
        >
          Limpar filtros
        </button>
      </div>
    </form>

    <p v-if="reports.isLoading.value" class="text-sm text-muted">Carregando relatórios…</p>
    <p v-else-if="reports.isError.value" class="text-sm text-danger">Não foi possível carregar os relatórios.</p>
    <template v-else>
      <p class="mb-2 text-xs text-muted">{{ filtered.length }} de {{ reports.data.value?.length ?? 0 }} documento(s)</p>
      <p
        v-if="filtered.length === 0"
        class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted"
      >
        {{ active ? 'Nenhum documento com esses filtros.' : 'Nenhum documento enviado ainda.' }}
      </p>
      <ul class="space-y-2">
        <li v-for="d in filtered" :key="d.id">
          <NuxtLink
            :to="`/revisao/${d.id}`"
            class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm hover:border-link"
          >
            <div class="min-w-0">
              <p class="text-sm font-medium text-body">
                {{ DOC_TYPE_LABEL[d.type as keyof typeof DOC_TYPE_LABEL] ?? d.type }}
                <span class="ml-1 font-mono text-xs text-muted">Nº {{ d.patientCode }}</span>
              </p>
              <p class="text-xs text-muted">Aluno: {{ d.authorName }}</p>
              <p class="text-xs text-muted">Enviado em {{ formatDateTime(d.submittedAt) }}</p>
            </div>
            <span class="pill" :class="STATUS_PILL[d.status] ?? 'pill-muted'">{{ STATUS_LABEL[d.status] ?? d.status }}</span>
          </NuxtLink>
        </li>
      </ul>
    </template>
  </section>
</template>
