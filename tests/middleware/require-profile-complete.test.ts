import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { Router, RouteLocationNormalized  } from 'vue-router';
import requireProfileComplete from '../../app/middleware/require-profile-complete';
import { useAuthStore } from '../../app/stores/auth';

// Mesmo motivo do teste de require-role: sem isto, o plugin de bootstrap de
// sessão tenta uma chamada de rede de verdade ao montar a app e trava o teste.
vi.mock('../../app/shared/api/client', () => ({
  api: {
    post: () => Promise.reject(new Error('sem sessão (mock de teste)')),
    get: () => Promise.reject(new Error('sem sessão (mock de teste)')),
  },
}));

const fakeRoute = {} as RouteLocationNormalized;
const EmptyStub = { template: '<div />' };

describe('middleware require-profile-complete', () => {
  let router: Router;

  beforeEach(async () => {
    const wrapper = await mountSuspended(EmptyStub);
    router = wrapper.vm.$router as Router;
  });

  it('redireciona para /completar-cadastro quando profileComplete é false', async () => {
    useAuthStore().setSession(
      { id: '1', email: 'a@a.com', fullName: 'Fulano', role: 'INTERN', profileComplete: false },
      'token-fake',
    );
    await requireProfileComplete(fakeRoute, fakeRoute);
    expect(router.currentRoute.value.fullPath).toBe('/completar-cadastro');
  });

  it('não bloqueia quando profileComplete é true', async () => {
    useAuthStore().setSession(
      { id: '1', email: 'a@a.com', fullName: 'Fulano', role: 'INTERN', profileComplete: true },
      'token-fake',
    );
    expect(await requireProfileComplete(fakeRoute, fakeRoute)).toBeUndefined();
  });

  it('não bloqueia quando profileComplete é undefined (papel que não é INTERN)', async () => {
    useAuthStore().setSession({ id: '1', email: 'a@a.com', fullName: 'Fulano', role: 'ADMIN' }, 'token-fake');
    expect(await requireProfileComplete(fakeRoute, fakeRoute)).toBeUndefined();
  });
});
