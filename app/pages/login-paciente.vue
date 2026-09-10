<script setup lang="ts">
import { useAuth } from '../composables/useAuth';
import { usePatientLogin } from '../composables/usePatientLogin';
import { isRateLimited } from '../shared/api/error-code';
import { maskCPF } from '../shared/lib/masks';

const { isAuthenticated } = useAuth();
const login = usePatientLogin();
const cpf = ref('');
const birthDate = ref('');

if (isAuthenticated.value) await navigateTo('/', { replace: true });

function onInputCpf(e: Event) {
  cpf.value = maskCPF((e.target as HTMLInputElement).value);
}

async function onSubmit() {
  login.mutate({ cpf: cpf.value, birthDate: birthDate.value }, { onSuccess: () => navigateTo('/', { replace: true }) });
}
</script>

<template>
  <div class="fsa-hero-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
      <h1 class="mb-1 text-xl font-semibold text-body">Portal do Paciente</h1>
      <p class="mb-6 text-sm text-muted">Entre com seu CPF e data de nascimento.</p>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1 block text-sm font-medium text-body">CPF</label>
          <input
            :value="cpf"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            placeholder="000.000.000-00"
            required
            @input="onInputCpf"
          >
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-body">Data de nascimento</label>
          <input
            v-model="birthDate"
            type="date"
            class="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none"
            required
          >
        </div>
        <p v-if="isRateLimited(login.error.value)" class="text-sm text-danger">Muitas tentativas. Aguarde alguns minutos e tente novamente.</p>
        <p v-else-if="login.isError.value" class="text-sm text-danger">CPF ou data de nascimento inválidos.</p>
        <button
          type="submit"
          :disabled="login.isPending.value"
          class="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        >
          {{ login.isPending.value ? '…' : 'Entrar' }}
        </button>
      </form>
      <div class="mt-6 border-t border-border pt-4 text-center text-sm">
        <NuxtLink to="/cadastro/paciente" class="font-medium text-link hover:underline">Ainda não tem cadastro? Cadastre-se</NuxtLink>
        <br>
        <NuxtLink to="/portal" class="mt-2 inline-block text-muted hover:underline">Voltar para o portal</NuxtLink>
      </div>
    </div>
  </div>
</template>
