import { defineVitestConfig } from '@nuxt/test-utils/config';

// Equivalente ao vitest.config.ts do frontend React original — mesma
// ferramenta (Vitest), mas o environment 'nuxt' (em vez de 'jsdom' puro)
// entende auto-imports do Nuxt (composables, componentes de app/components)
// dentro dos testes, sem precisar importar tudo manualmente.
export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
});
