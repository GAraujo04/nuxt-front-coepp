<script setup lang="ts">
import { isAxiosError } from 'axios';
import { useAuth } from '../composables/useAuth';
import { useInternLogin } from '../composables/useInternLogin';
import { applyMask, maskUsuarioRm, MASK_LENGTH } from '../shared/lib/masks';

type ErrorKind = 'invalid' | 'forbidden' | 'unavailable' | null;

function errorKindFrom(error: unknown): ErrorKind {
  if (!isAxiosError<{ code?: string }>(error)) return null;
  const code = error.response?.data?.code;
  if (code === 'forbidden') return 'forbidden';
  if (code === 'service_unavailable') return 'unavailable';
  // unauthorized (credencial inválida) e validation_failed (formato/vínculo) usam a mesma mensagem genérica.
  return 'invalid';
}

const { isAuthenticated } = useAuth();
const login = useInternLogin();
const usuarioRm = ref('');
const senhaRm = ref('');
const linkEmail = ref('');

if (isAuthenticated.value) await navigateTo('/', { replace: true });

// computed em vez de recalcular "a cada render" (não existe render aqui) —
// só reavalia quando login.isError ou login.error mudam de valor.
const errorKind = computed<ErrorKind>(() => (login.isError.value ? errorKindFrom(login.error.value) : null));

function onInputUsuarioRm(e: Event) {
  usuarioRm.value = applyMask(e, maskUsuarioRm);
}

async function onSubmit() {
  login.mutate(
    { usuarioRm: usuarioRm.value, senhaRm: senhaRm.value, linkEmail: linkEmail.value.trim() || undefined },
    {
      // 1º acesso (conta nova ou recém-vinculada, ainda sem disciplina/
      // supervisor/disponibilidade/termo) cai direto no formulário de
      // completar cadastro, em vez do painel normal.
      onSuccess: (data) => navigateTo(data.user.profileComplete === false ? '/completar-cadastro' : '/', { replace: true }),
    },
  );
}
</script>

<template>
  <div class="fsa-hero-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
      <h1 class="mb-1 text-xl font-semibold text-body">Login do Estagiário</h1>
      <p class="mb-6 text-sm text-muted">Entre com seu usuário e senha institucionais (TOTVS RM).</p>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-body">Usuário RM</label>
          <input
            :value="usuarioRm"
            :maxlength="MASK_LENGTH.usuarioRm"
            inputmode="numeric"
            autocomplete="username"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            placeholder="Somente números"
            required
            @input="onInputUsuarioRm"
          >
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-body">Senha</label>
          <input
            v-model="senhaRm"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            required
          >
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-body">
            E-mail do cadastro antigo <span class="font-normal text-muted">(opcional)</span>
          </label>
          <input
            v-model="linkEmail"
            type="email"
            autocomplete="email"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            placeholder="Só se você já tinha uma conta antes"
          >
          <p class="mt-1 text-xs text-muted">
            Já tinha cadastro de antes desse login? Informe o e-mail usado nele para vincular seus dados. Se é seu
            primeiro acesso, deixe em branco — você vai completar o cadastro em seguida.
          </p>
        </div>

        <p v-if="errorKind === 'invalid'" class="pill-danger rounded px-2 py-1 text-sm">Usuário ou senha inválidos.</p>
        <p v-else-if="errorKind === 'forbidden'" class="pill-muted rounded px-2 py-1 text-sm">
          Este login é exclusivo para alunos/estagiários. Se você é funcionário ou professor, procure o Administrativo.
        </p>
        <p v-else-if="errorKind === 'unavailable'" class="pill-info rounded px-2 py-1 text-sm">
          O sistema de autenticação da instituição está indisponível no momento. Tente novamente em alguns minutos.
        </p>

        <button
          type="submit"
          :disabled="login.isPending.value"
          class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        >
          {{ login.isPending.value ? '…' : 'Entrar' }}
        </button>
      </form>
      <div class="mt-6 border-t border-border pt-4 text-center text-sm">
        <NuxtLink to="/portal" class="text-muted hover:underline">Voltar para o portal</NuxtLink>
      </div>
    </div>
  </div>
</template>
