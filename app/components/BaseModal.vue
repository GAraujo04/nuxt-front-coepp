<script setup lang="ts">
// Modal simples e acessível, sem dependências externas: fecha com Esc ou
// clique no backdrop. Equivalente a shared/ui/Modal.tsx — não desmonta o
// formulário por trás (v-if só no conteúdo do modal, não na página toda).
defineProps<{ open: boolean; title: string }>();
const emit = defineEmits<{ close: [] }>();

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}

onMounted(() => document.addEventListener('keydown', onKeydown));
onUnmounted(() => document.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click="emit('close')">
    <div
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      class="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-surface p-6 shadow-lg"
      @click.stop
    >
      <div class="mb-4 flex items-center justify-between gap-4">
        <h2 class="text-lg font-semibold text-body">{{ title }}</h2>
        <button
          type="button"
          aria-label="Fechar"
          class="rounded-md px-2 py-1 text-muted hover:bg-surface2 hover:text-body"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>
