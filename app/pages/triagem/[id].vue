<script setup lang="ts">
import { maskCurrency } from '../../shared/lib/masks';
import { useSaveScreeningDraft, useScreening } from '../../composables/useScreenings';
import { useTransition } from '../../composables/useDocuments';
import { getAt, missingFields, setAt, stepsFor } from '../../shared/screening/fields';
import type { FieldDef } from '../../shared/screening/fields';

definePageMeta({
  layout: 'authenticated',
  middleware: ['require-role', 'require-profile-complete'],
  roles: ['INTERN'],
});

// Wizard multi-step da triagem: preenchimento com auto-save + envio à
// supervisão. Equivalente a features/screening/pages/ScreeningWizardPage.tsx.
const TYPE_LABEL = { SCREENING_ADULT: 'Adulto', SCREENING_CHILD: 'Criança/Adolescente' } as const;
const EDITABLE = new Set(['RASCUNHO', 'REVISAO_SOLICITADA']);
const DOC_PILL: Record<string, string> = {
  RASCUNHO: 'pill-muted',
  ENVIADO_PARA_SUPERVISAO: 'pill-info',
  EM_REVISAO: 'pill-info',
  REVISAO_SOLICITADA: 'pill-warn',
  REJEITADO: 'pill-danger',
  APROVADO_LOCKED: 'pill-ok',
};
const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none disabled:opacity-70';

const route = useRoute();
// route.params.id como getter (não valor direto) — a rota é dinâmica e o
// Nuxt reusa a mesma instância da página ao navegar entre triagens
// diferentes, então a query de baixo precisa de uma fonte reativa pra saber
// que deve refazer o fetch sozinha.
const id = computed(() => route.params.id as string);
const query = useScreening(id);
const save = useSaveScreeningDraft();
const transition = useTransition();

const content = ref<Record<string, unknown>>({});
const version = ref(1);
const step = ref(0);
const savedAt = ref<string | null>(null);
const missing = ref<{ step: string; label: string }[]>([]);
const dirty = ref(false);

watch(
  () => query.data.value,
  (data) => {
    if (data) {
      content.value = data.content ?? {};
      version.value = data.version;
    }
  },
  { immediate: true },
);

const editable = computed(() => (query.data.value ? EDITABLE.has(query.data.value.status) : false));
const steps = computed(() => (query.data.value ? stepsFor(query.data.value.type) : []));
const current = computed(() => steps.value[step.value]);

// Equivalente ao useEffect com debounce do React: dispara auto-save 1.2s
// depois da última mudança em content. onWatcherCleanup (Vue 3.5+) substitui
// o retorno de função de limpeza do useEffect — roda antes da próxima
// execução do watcher e também ao desmontar a página.
watch(content, () => {
  if (!dirty.value || !editable.value) return;
  const screeningId = id.value;
  const timer = setTimeout(() => {
    save.mutate(
      { id: screeningId, content: content.value, expectedVersion: version.value },
      {
        onSuccess: (updated) => {
          version.value = updated.version;
          savedAt.value = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          dirty.value = false;
        },
      },
    );
  }, 1200);
  onWatcherCleanup(() => clearTimeout(timer));
});

function onChange(field: FieldDef, value: string) {
  if (!editable.value) return;
  dirty.value = true;
  content.value = setAt(content.value, field.path, value);
}

function onFieldInput(field: FieldDef, e: Event) {
  const raw = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  onChange(field, field.kind === 'currency' ? maskCurrency(raw) : raw);
}

function handleSubmit() {
  if (!query.data.value) return;
  const m = missingFields(query.data.value.type, content.value);
  missing.value = m;
  if (m.length === 0) transition.mutate({ id: id.value, action: 'SUBMIT' });
}
</script>

<template>
  <p v-if="query.isLoading.value" class="text-sm text-muted">Carregando triagem…</p>
  <p v-else-if="query.isError.value || !query.data.value" class="text-sm text-danger">Triagem não encontrada.</p>
  <div v-else class="mx-auto max-w-3xl">
    <NuxtLink to="/estagiario" class="mb-3 inline-block text-sm font-medium text-link hover:underline">← Voltar ao painel</NuxtLink>
    <div class="rounded-lg border border-border bg-surface p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <span class="text-sm font-bold text-muted">
          Triagem — {{ TYPE_LABEL[query.data.value.type] }} · Nº {{ query.data.value.numero ?? '—' }}
        </span>
        <span class="pill" :class="DOC_PILL[query.data.value.status] ?? 'pill-muted'">{{ query.data.value.status }}</span>
        <span v-if="editable" class="ml-auto text-xs font-semibold text-ok">
          {{ save.isPending.value ? 'Salvando…' : savedAt ? `Salvo às ${savedAt}` : 'Rascunho' }}
        </span>
      </div>

      <!-- Banner de estado -->
      <div v-if="query.data.value.status === 'REVISAO_SOLICITADA'" class="mb-4 rounded-md border border-border bg-surface2 p-3 text-sm text-body">
        O supervisor <strong>solicitou ajustes</strong>. Corrija e reenvie para supervisão.
      </div>
      <div v-else-if="!editable" class="mb-4 rounded-md border border-border bg-surface2 p-3 text-sm text-muted">
        {{
          query.data.value.status === 'APROVADO_LOCKED'
            ? 'Documento aprovado e assinado — somente leitura (imutável).'
            : 'Documento em supervisão — somente leitura.'
        }}
      </div>
      <div v-if="missing.length > 0" class="mb-4 rounded-md border border-border bg-surface2 p-3 text-sm">
        <p class="mb-1 font-semibold text-danger">Preencha todos os campos antes de enviar. Faltam:</p>
        <ul class="list-inside list-disc text-muted">
          <li v-for="(mm, i) in missing.slice(0, 8)" :key="i">{{ mm.step }}: {{ mm.label }}</li>
          <li v-if="missing.length > 8">…e mais {{ missing.length - 8 }} campo(s).</li>
        </ul>
      </div>

      <!-- Stepper -->
      <div class="mb-6 flex items-center gap-1 overflow-x-auto pb-1">
        <div v-for="(s, i) in steps" :key="s.id" class="flex items-center gap-1">
          <button
            class="flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold"
            :class="i === step ? 'text-link' : i < step ? 'text-body' : 'text-muted'"
            @click="step = i"
          >
            <span
              class="grid h-6 w-6 place-items-center rounded-full border text-xs"
              :class="i === step ? 'border-link bg-primary/10 text-link' : i < step ? 'border-primary bg-primary text-onprimary' : 'border-border bg-surface2 text-muted'"
            >
              {{ i + 1 }}
            </span>
            <span class="whitespace-nowrap">{{ s.label }}</span>
          </button>
          <span v-if="i < steps.length - 1" class="h-px w-6 bg-border" />
        </div>
      </div>

      <!-- Campos -->
      <div class="space-y-4">
        <div v-for="field in current?.fields ?? []" :key="field.path">
          <label class="mb-1 block text-sm font-semibold text-body">{{ field.label }}</label>
          <p v-if="field.hint" class="mb-1 text-xs text-muted">{{ field.hint }}</p>
          <textarea
            v-if="field.kind === 'textarea'"
            :class="`${fieldClass} min-h-20`"
            :value="getAt(content, field.path)"
            :disabled="!editable"
            @input="onFieldInput(field, $event)"
          />
          <select
            v-else-if="field.kind === 'select'"
            :class="fieldClass"
            :value="getAt(content, field.path)"
            :disabled="!editable"
            @change="onFieldInput(field, $event)"
          >
            <option value="">Selecione…</option>
            <option v-for="o in field.options" :key="o" :value="o">{{ o }}</option>
          </select>
          <PhoneField
            v-else-if="field.kind === 'phone'"
            :model-value="getAt(content, field.path)"
            :disabled="!editable"
            @update:model-value="(v) => onChange(field, v)"
          />
          <input
            v-else
            :type="field.kind === 'date' ? 'date' : 'text'"
            :class="fieldClass"
            :value="getAt(content, field.path)"
            :disabled="!editable"
            @input="onFieldInput(field, $event)"
          >
        </div>
      </div>

      <!-- Navegação + ações -->
      <div class="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div class="flex gap-2">
          <button
            :disabled="step === 0"
            class="rounded-md border border-border px-4 py-2 text-sm font-medium text-body hover:bg-surface2 disabled:opacity-50"
            @click="step = Math.max(0, step - 1)"
          >
            ← Voltar
          </button>
          <button
            v-if="step < steps.length - 1"
            class="rounded-md border border-border px-4 py-2 text-sm font-medium text-body hover:bg-surface2"
            @click="step = Math.min(steps.length - 1, step + 1)"
          >
            Próximo →
          </button>
        </div>

        <div v-if="editable" class="text-right">
          <button
            :disabled="transition.isPending.value"
            class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
            @click="handleSubmit"
          >
            {{ transition.isPending.value ? 'Assinando…' : 'Assinar e enviar para supervisão' }}
          </button>
          <p class="mt-1 text-xs text-muted">Ao enviar, você assina o documento.</p>
        </div>
        <button
          v-if="query.data.value.status === 'REJEITADO'"
          :disabled="transition.isPending.value"
          class="rounded-md border border-border px-4 py-2 text-sm font-medium text-body hover:bg-surface2"
          @click="transition.mutate({ id, action: 'REOPEN' })"
        >
          Reabrir para edição
        </button>
      </div>
    </div>

    <div class="mt-6">
      <SignaturesPanel :signatures="query.data.value.signatures" />
    </div>
  </div>
</template>
