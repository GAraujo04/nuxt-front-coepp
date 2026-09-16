<script setup lang="ts">
import { z } from 'zod';
import { useAuth } from '../composables/useAuth';
import { useLogin } from '../composables/useLogin';
import { isRateLimited } from '../shared/api/error-code';

// Login do Coordenador — mesmo backend/mecanismo de login.vue (POST
// /auth/login, papel SUPERVISOR), só com identidade visual própria. Não é
// um perfil novo: "Coordenador" é apenas o rótulo desta tela para o mesmo
// SUPERVISOR já existente no sistema.
const { isAuthenticated } = useAuth();
const login = useLogin();

if (isAuthenticated.value) await navigateTo('/', { replace: true });

const loginSchema = z.object({
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
});

const email = ref('');
const password = ref('');
const errors = ref<{ email?: string; password?: string }>({});

async function onSubmit() {
  const result = loginSchema.safeParse({ email: email.value, password: password.value });
  if (!result.success) {
    const flat = result.error.flatten().fieldErrors;
    errors.value = { email: flat.email?.[0], password: flat.password?.[0] };
    return;
  }
  errors.value = {};
  login.mutate(result.data, { onSuccess: () => navigateTo('/', { replace: true }) });
}
</script>

<template>
  <div class="fsa-hero-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
      <h1 class="mb-1 text-xl font-semibold text-body">Login Coordenador</h1>
      <p class="mb-6 text-sm text-muted">Entre com seu e-mail e senha.</p>
      <form class="space-y-4" novalidate @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-body">E-mail</label>
          <input
            v-model="email"
            type="email"
            autocomplete="username"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            placeholder="voce@clinica.br"
          >
          <p v-if="errors.email" class="mt-1 text-xs text-danger">{{ errors.email }}</p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-body">Senha</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
          >
          <p v-if="errors.password" class="mt-1 text-xs text-danger">{{ errors.password }}</p>
        </div>
        <p v-if="isRateLimited(login.error.value)" class="text-sm text-danger">Muitas tentativas. Aguarde alguns minutos e tente novamente.</p>
        <p v-else-if="login.isError.value" class="text-sm text-danger">E-mail ou senha inválidos.</p>
        <button
          type="submit"
          :disabled="login.isPending.value"
          class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        >
          {{ login.isPending.value ? '…' : 'Acessar o sistema' }}
        </button>
      </form>
      <div class="mt-6 border-t border-border pt-4 text-center text-sm">
        <NuxtLink to="/portal" class="font-medium text-link hover:underline">Ir para o portal de acessos</NuxtLink>
      </div>
    </div>
  </div>
</template>
