<script setup lang="ts">
import { maskCurrency } from '../shared/lib/masks';
import type { FieldDef } from '../shared/screening/fields';

// Renderiza UM campo de documento conforme `field.kind`. Extraído do wizard
// para que o grupo repetível (os atendimentos da Ficha de Evolução) use
// exatamente este render, em vez de uma segunda cópia do markup que
// divergiria na primeira alteração.
const props = defineProps<{ field: FieldDef; value: string; disabled?: boolean }>();
const emit = defineEmits<{ update: [value: string] }>();

const fieldClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none disabled:opacity-70';

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  emit('update', props.field.kind === 'currency' ? maskCurrency(raw) : raw);
}
</script>

<template>
  <div>
    <label class="mb-1 block text-sm font-semibold text-body">{{ field.label }}</label>
    <p v-if="field.hint" class="mb-1 text-xs text-muted">{{ field.hint }}</p>

    <!-- 'readonly': valor copiado do cadastro do paciente quando o documento
         foi criado. Exibido como texto, não como input desabilitado, pra
         deixar claro que não é um campo a preencher — e pra não sugerir que
         habilitaria em outro estado do documento. -->
    <p
      v-if="field.kind === 'readonly'"
      class="rounded-md border border-border bg-surface2 px-3 py-2 text-sm text-body"
    >
      {{ value || '—' }}
    </p>
    <textarea
      v-else-if="field.kind === 'textarea'"
      :class="`${fieldClass} min-h-20`"
      :value="value"
      :disabled="disabled"
      @input="onInput"
    />
    <select
      v-else-if="field.kind === 'select'"
      :class="fieldClass"
      :value="value"
      :disabled="disabled"
      @change="onInput"
    >
      <option value="">Selecione…</option>
      <option v-for="o in field.options" :key="o" :value="o">{{ o }}</option>
    </select>
    <PhoneField
      v-else-if="field.kind === 'phone'"
      :model-value="value"
      :disabled="disabled"
      @update:model-value="(v) => emit('update', v)"
    />
    <input
      v-else
      :type="field.kind === 'date' ? 'date' : 'text'"
      :class="fieldClass"
      :value="value"
      :disabled="disabled"
      @input="onInput"
    >
  </div>
</template>
