import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import App from '../app/app.vue';

// Teste de fumaça só pra confirmar que a esteira de teste (Vitest +
// @nuxt/test-utils, environment 'nuxt') está funcionando de ponta a ponta
// antes de migrar a primeira feature de verdade.
describe('app.vue', () => {
  it('monta sem lançar erro', async () => {
    const wrapper = await mountSuspended(App);
    expect(wrapper.exists()).toBe(true);
  });
});
