<script setup lang="ts">
import type { NuxtError } from '#app';

// Nome de arquivo reservado do Nuxt: qualquer rota sem match (ou erro não
// tratado em runtime) cai aqui automaticamente — substitui o catch-all
// { path: '*', element: <NotFoundPage /> } do router.tsx original, que
// precisava ser declarado à mão.
const props = defineProps<{ error: NuxtError }>();
const { t } = useI18n();

function goHome() {
  clearError({ redirect: '/' });
}
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg p-4 text-center">
    <span class="text-5xl font-bold text-muted">{{ props.error.statusCode }}</span>
    <p class="text-body">{{ props.error.statusCode === 404 ? t('errors.notFound') : props.error.message }}</p>
    <button type="button" class="text-sm font-medium text-link hover:underline" @click="goHome">Voltar ao início</button>
  </div>
</template>
