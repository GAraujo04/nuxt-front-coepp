<script setup lang="ts">
import { getAt, getList, itemPath } from '../shared/screening/fields';
import type { RepeatDef } from '../shared/screening/fields';

// Grupo de campos que se repete dentro de uma etapa — hoje os atendimentos
// da Ficha de Evolução.
//
// Componente próprio, e não um bloco no template do wizard, porque ali o
// `repeat` só existe sob um `v-if` e essa narrowing não alcança os escopos
// aninhados dos `v-for` — o que obrigaria a espalhar `!` por cada uso.
// Recebendo `repeat` como prop obrigatória, o tipo é garantido na borda.
const props = defineProps<{ repeat: RepeatDef; content: Record<string, unknown>; disabled?: boolean }>();
const emit = defineEmits<{ update: [path: string, value: string]; add: []; remove: [index: number] }>();

const items = computed(() => getList(props.content, props.repeat.path));
</script>

<template>
  <p v-if="items.length === 0" class="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted">
    Nenhum {{ repeat.itemLabel.toLowerCase() }} registrado ainda.
  </p>

  <div v-for="(_, index) in items" :key="index" class="space-y-4 rounded-md border border-border bg-surface2 p-4">
    <div class="flex items-center justify-between">
      <p class="text-sm font-bold text-body">{{ repeat.itemLabel }} {{ index + 1 }}</p>
      <button
        v-if="!disabled"
        type="button"
        class="rounded-md border border-border px-2 py-1 text-xs font-medium text-danger hover:bg-surface"
        @click="emit('remove', index)"
      >
        Remover
      </button>
    </div>
    <DocumentField
      v-for="field in repeat.fields"
      :key="field.path"
      :field="field"
      :value="getAt(content, itemPath(repeat, index, field))"
      :disabled="disabled"
      @update="(v) => emit('update', itemPath(repeat, index, field), v)"
    />
  </div>

  <button
    v-if="!disabled"
    type="button"
    class="w-full rounded-md border border-dashed border-border px-4 py-2 text-sm font-medium text-link hover:bg-surface2"
    @click="emit('add')"
  >
    {{ repeat.addLabel }}
  </button>
</template>
