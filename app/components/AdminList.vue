<script setup lang="ts">
// Lista genérica (nome/subtítulo) usada nas 3 colunas da aba "Usuários" do
// admin. Equivalente ao helper local `List` de AdminDashboard.tsx — vira
// componente próprio aqui porque o Vue não tem uma forma idiomática de
// declarar um componente auxiliar só-deste-arquivo dentro de <script setup>
// (React permite uma function component qualquer no mesmo módulo).
defineProps<{ title: string; rows?: { id: string; main: string; sub: string }[] }>();
</script>

<template>
  <div class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <h2 class="mb-3 text-sm font-semibold text-body">
      {{ title }} <span v-if="rows" class="text-muted">({{ rows.length }})</span>
    </h2>
    <ul class="space-y-1 text-sm">
      <li v-for="r in rows" :key="r.id" class="flex justify-between gap-3 border-b border-border py-1 last:border-0">
        <span class="min-w-0 break-words text-body">{{ r.main }}</span>
        <span class="shrink-0 text-muted">{{ r.sub }}</span>
      </li>
      <li v-if="rows && rows.length === 0" class="text-muted">Nenhum cadastro.</li>
    </ul>
  </div>
</template>
