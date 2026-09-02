// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // @pinia/nuxt substitui o Zustand (ver ADR-0004 no pep-main) — auto-importa
  // stores de stores/*.ts, sem precisar de <PiniaProvider> envolvendo a árvore
  // como o Zustand nem precisava, mas o Pinia integra com o devtools do Nuxt.
  modules: ['@pinia/nuxt', '@nuxt/eslint'],
})
