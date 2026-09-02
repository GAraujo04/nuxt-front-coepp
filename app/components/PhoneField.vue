<script setup lang="ts">
import { maskPhone } from '../shared/lib/masks';

// Campo de telefone com seletor móvel/fixo e máscara. `label` é opcional
// (uso dentro de outro campo). Equivalente a shared/ui/PhoneField.tsx.
defineProps<{ label?: string; disabled?: boolean }>();
const value = defineModel<string>({ required: true });

const mobile = ref(true);

function onSelectKind(e: Event) {
  mobile.value = (e.target as HTMLSelectElement).value === 'm';
  value.value = maskPhone(value.value, mobile.value);
}

function onInputValue(e: Event) {
  value.value = maskPhone((e.target as HTMLInputElement).value, mobile.value);
}
</script>

<template>
  <label v-if="label" class="block text-sm">
    <span class="mb-1 block font-medium text-body">{{ label }}</span>
    <div class="flex gap-2">
      <select
        :value="mobile ? 'm' : 'f'"
        :disabled="disabled"
        class="rounded-md border border-border bg-surface px-2 py-2 text-sm text-body focus:border-link focus:outline-none disabled:opacity-70"
        @change="onSelectKind"
      >
        <option value="m">Móvel</option>
        <option value="f">Fixo</option>
      </select>
      <input
        :value="value"
        :disabled="disabled"
        class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none disabled:opacity-70"
        :placeholder="mobile ? '(11) 91234-5678' : '(11) 1234-5678'"
        @input="onInputValue"
      >
    </div>
  </label>
  <div v-else class="flex gap-2">
    <select
      :value="mobile ? 'm' : 'f'"
      :disabled="disabled"
      class="rounded-md border border-border bg-surface px-2 py-2 text-sm text-body focus:border-link focus:outline-none disabled:opacity-70"
      @change="onSelectKind"
    >
      <option value="m">Móvel</option>
      <option value="f">Fixo</option>
    </select>
    <input
      :value="value"
      :disabled="disabled"
      class="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none disabled:opacity-70"
      :placeholder="mobile ? '(11) 91234-5678' : '(11) 1234-5678'"
      @input="onInputValue"
    >
  </div>
</template>
