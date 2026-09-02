import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import type { Router, RouteLocationNormalized  } from 'vue-router';
import requireRole from '../../app/middleware/require-role';
import { useAuthStore } from '../../app/stores/auth';
import type { Role } from '../../app/shared/auth/types';

// plugins/session-bootstrap.ts chama a API de verdade ao montar a app
// (mesmo montando um componente qualquer, plugins do Nuxt rodam no boot).
// Sem backend no ar, a chamada travaria o teste (sem timeout configurado no
// client) — mocka pra simular a resposta real de "sem sessão" (401/erro de
// rede), que é exatamente o caminho de "anônimo" que os testes exercitam.
vi.mock('../../app/shared/api/client', () => ({
  api: {
    post: () => Promise.reject(new Error('sem sessão (mock de teste)')),
    get: () => Promise.reject(new Error('sem sessão (mock de teste)')),
  },
}));

function fakeRoute(roles?: Role[]): RouteLocationNormalized {
  return { meta: { roles } } as RouteLocationNormalized;
}

// Componente vazio só pra ter algo pra montar — o que precisamos do
// mountSuspended não é a árvore de componentes, é o contexto Nuxt/Pinia
// ativo (useAuthStore, navigateTo) que o middleware usa por baixo. Montar
// app/app.vue de verdade traria o NuxtPage -> pages/index.vue, cujo próprio
// redirect ia disputar a navegação com a do teste.
const EmptyStub = { template: '<div />' };

// Testa a lógica do guard isoladamente (sem depender de nenhuma página
// protegida existir ainda — este slice só monta o esqueleto de roteamento).
describe('middleware require-role', () => {
  let router: Router;

  beforeEach(async () => {
    // useRouter() só funciona dentro de setup()/injection context — pega a
    // instância pelo wrapper montado em vez de chamar o composable direto
    // aqui no corpo do teste.
    const wrapper = await mountSuspended(EmptyStub);
    router = wrapper.vm.$router as Router;
    useAuthStore().clear();
  });

  it('não bloqueia página sem roles declarados', () => {
    expect(requireRole(fakeRoute(undefined), fakeRoute())).toBeUndefined();
  });

  // Chamado fora do ciclo real de navegação do router (como aqui, direto),
  // navigateTo() não devolve o destino como valor de retorno — ele já
  // dispara a navegação de verdade. Por isso a verificação é no estado do
  // router depois de aguardar, não no valor retornado pela middleware.
  it('redireciona usuário anônimo para /portal', async () => {
    await requireRole(fakeRoute(['ADMIN']), fakeRoute());
    expect(router.currentRoute.value.fullPath).toBe('/portal');
  });

  it('redireciona usuário com papel errado para /403', async () => {
    useAuthStore().setSession(
      { id: '1', email: 'a@a.com', fullName: 'Fulano', role: 'PATIENT' },
      'token-fake',
    );
    await requireRole(fakeRoute(['ADMIN']), fakeRoute());
    expect(router.currentRoute.value.fullPath).toBe('/403');
  });

  it('deixa passar usuário com o papel certo', async () => {
    useAuthStore().setSession(
      { id: '1', email: 'a@a.com', fullName: 'Fulano', role: 'ADMIN' },
      'token-fake',
    );
    expect(await requireRole(fakeRoute(['ADMIN']), fakeRoute())).toBeUndefined();
  });
});
