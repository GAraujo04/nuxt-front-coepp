<script setup lang="ts">
// Equivalente a ForbiddenPage (shared/ui/ErrorPages.tsx). Rota explícita
// (não passa pelo app/error.vue) porque é um destino de redirect do
// middleware require-role, não um "caminho não encontrado".
const { t } = useI18n();
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg p-4 text-center">
    <span class="text-5xl font-bold text-muted">403</span>
    <p class="text-body">{{ t('errors.forbidden') }}</p>
    <NuxtLink to="/" class="text-sm font-medium text-link hover:underline">Voltar ao início</NuxtLink>
  </div>
</template>
