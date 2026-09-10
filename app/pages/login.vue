<script setup lang="ts">
import { z } from 'zod';
import { useAuth } from '../composables/useAuth';
import { useLogin } from '../composables/useLogin';
import { isRateLimited } from '../shared/api/error-code';

const { t } = useI18n();
const { isAuthenticated } = useAuth();
const login = useLogin();

// Equivalente ao `if (isAuthenticated) return <Navigate to="/" replace />;`
// do React — só que aqui é uma chamada imperativa, não um valor de retorno.
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
  login.mutate(result.data, {
    onSuccess: () => navigateTo('/', { replace: true }),
  });
}
</script>

<template>
  <div class="fsa-hero-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
      <h1 class="mb-1 text-xl font-semibold text-body">{{ t('app.name') }}</h1>
      <p class="mb-6 text-sm text-muted">{{ t('auth.login') }}</p>
      <form class="space-y-4" novalidate @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-body">{{ t('auth.email') }}</label>
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
          <label class="mb-1 block text-sm font-medium text-body">{{ t('auth.password') }}</label>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
          >
          <p v-if="errors.password" class="mt-1 text-xs text-danger">{{ errors.password }}</p>
        </div>
        <p v-if="isRateLimited(login.error.value)" class="text-sm text-danger">{{ t('auth.tooManyAttempts') }}</p>
        <p v-else-if="login.isError.value" class="text-sm text-danger">{{ t('auth.invalidCredentials') }}</p>
        <button
          type="submit"
          :disabled="login.isPending.value"
          class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        >
          {{ login.isPending.value ? '…' : t('auth.signIn') }}
        </button>
      </form>
      <div class="mt-6 border-t border-border pt-4 text-center text-sm">
        <NuxtLink to="/portal" class="font-medium text-link hover:underline">Ir para o portal</NuxtLink>
      </div>
    </div>
  </div>
</template>
