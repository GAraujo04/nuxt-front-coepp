<script setup lang="ts">
import { useAuth } from '../composables/useAuth';
import { useInternLogin } from '../composables/useInternLogin';
import { applyMask, maskUsuarioRm, MASK_LENGTH } from '../shared/lib/masks';
import { apiErrorCode } from '../shared/api/error-code';

type ErrorKind = 'invalid' | 'format' | 'forbidden' | 'unavailable' | 'rate-limited' | null;

function errorKindFrom(error: unknown): ErrorKind {
  const code = apiErrorCode(error);
  if (code === null) return null;
  if (code === 'forbidden') return 'forbidden';
  if (code === 'service_unavailable') return 'unavailable';
  if (code === 'rate_limited') return 'rate-limited';
  // validation_failed aqui é o formato do usuário (11 dígitos) — esta tela
  // não envia e-mail de vínculo. Antes caía em "senha inválida", e o aluno
  // ia trocar uma senha que estava certa.
  if (code === 'validation_failed') return 'format';
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
const shortUser = ref(false);

function onInputUsuarioRm(e: Event) {
  usuarioRm.value = applyMask(e, maskUsuarioRm);
}

async function onSubmit() {
  // Checado antes de ir ao TOTVS: o backend recusaria do mesmo jeito.
  shortUser.value = usuarioRm.value.length !== MASK_LENGTH.usuarioRm;
  if (shortUser.value) return;
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
    <div class="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-8">
      <h1 class="mb-1 text-xl font-semibold text-body">Login do Aluno</h1>
      <p class="mb-6 text-sm text-muted">Entre com seu usuário e senha institucionais.</p>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-body">Usuário</label>
          <input
            :value="usuarioRm"
            :maxlength="MASK_LENGTH.usuarioRm"
            inputmode="numeric"
            autocomplete="username"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            required
            @input="onInputUsuarioRm"
          >
          <p class="mt-1 text-xs text-muted">Seu usuário do portal acadêmico: {{ MASK_LENGTH.usuarioRm }} números.</p>
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

        <p v-if="shortUser || errorKind === 'format'" class="pill-danger rounded px-2 py-1 text-sm">
          O usuário deve ter exatamente {{ MASK_LENGTH.usuarioRm }} números (você digitou {{ usuarioRm.length }}).
        </p>
        <p v-else-if="errorKind === 'invalid'" class="pill-danger rounded px-2 py-1 text-sm">Usuário ou senha inválidos.</p>
        <p v-else-if="errorKind === 'forbidden'" class="pill-muted rounded px-2 py-1 text-sm">
          Este login é exclusivo para alunos/estagiários. Se você é funcionário ou professor, procure o Administrativo.
        </p>
        <p v-else-if="errorKind === 'rate-limited'" class="pill-muted rounded px-2 py-1 text-sm">
          Muitas tentativas. Aguarde alguns minutos e tente novamente.
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
