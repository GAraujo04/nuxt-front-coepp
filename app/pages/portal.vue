<script setup lang="ts">
// Portal de entrada público (sem autenticação, rota /portal). Só navegação:
// direciona cada perfil pra tela de login já existente — não valida
// credencial, não consulta dados de usuário, não expõe nada do sistema.
//
// Nome do slice ("entry-portal") deliberadamente distinto do slice "portal"
// (o painel autenticado do paciente, com suas próprias consultas), pra não
// confundir os dois — ver docs/specs/migracao-frontend-vue-nuxt.md no
// pep-main para o mapeamento completo.
interface PortalCard {
  key: string;
  to: string;
}

// Admin como card público aqui é uma decisão consciente de exposição, não
// uma falha — o login continua protegido por senha + rate-limit igual aos
// outros. Decisão revisada e confirmada pelo usuário no React original: quer
// os 4 perfis visíveis no portal.
const CARDS: PortalCard[] = [
  { key: 'intern', to: '/login-estagiario' },
  { key: 'patient', to: '/login-paciente' },
  { key: 'supervisor', to: '/login-coordenador' },
  { key: 'admin', to: '/login' },
];

const { t } = useI18n();
</script>

<template>
  <div class="fsa-hero-bg min-h-screen">
    <header class="flex items-center gap-3 bg-fsa-superficie px-6 py-4">
      <img src="/logo-fsa.png" :alt="t('portal.logoAlt')" class="h-12 w-auto">
    </header>

    <main class="mx-auto max-w-5xl px-6 py-16 text-center">
      <h1 class="fsa-title text-4xl sm:text-5xl">{{ t('portal.title') }}</h1>
      <p class="mt-3 text-base text-fsa-texto-claro">{{ t('portal.subtitle') }}</p>

      <div class="mt-16 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        <!-- Cards ficam direto sobre o gradiente (sem moldura/fundo de card) —
             título + botão, igual à referência visual do Portal FSA.
             .fsa-hero-bg já garante contraste do texto branco em qualquer
             ponto do gradiente. -->
        <article
          v-for="card in CARDS"
          :key="card.key"
          class="flex flex-col items-center gap-4 text-center"
          :aria-labelledby="`portal-card-${card.key}`"
        >
          <h2 :id="`portal-card-${card.key}`" class="fsa-title text-base sm:text-lg">
            {{ t(`portal.cards.${card.key}.title`) }}
          </h2>
          <!-- Descrição de cada perfil fica só como texto acessível (screen
               reader), não visível — a referência mostra só título + botão;
               o aria-label do link já identifica o destino sem precisar de
               um parágrafo visível a mais. -->
          <p class="sr-only">{{ t(`portal.cards.${card.key}.description`) }}</p>
          <NuxtLink
            :to="card.to"
            class="inline-flex items-center gap-2 rounded-lg border border-fsa-menta bg-primary px-6 py-2.5 text-sm font-bold text-onprimary shadow-md transition-colors hover:bg-primaryh active:opacity-90"
            :aria-label="t('portal.accessAriaLabel', { portal: t(`portal.cards.${card.key}.title`) })"
          >
            <span aria-hidden="true">⚡</span>
            {{ t('portal.accessButton') }}
          </NuxtLink>
        </article>
      </div>
    </main>
  </div>
</template>
