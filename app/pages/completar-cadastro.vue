<script setup lang="ts">
import { applyMask, maskRA, MASK_LENGTH } from '../shared/lib/masks';
import { useAuthStore } from '../stores/auth';
import { api } from '../shared/api/client';
import { useCompleteInternProfile, useRegistrationOptions, useResponsibilityTerm } from '../composables/useEnrollment';
import type { AvailabilityWindowValue } from '../components/WeeklyAvailabilityPicker.vue';

// Só require-role aqui (não require-profile-complete) — senão o próprio
// redirect não teria pra onde ir. Sem layout: 'authenticated' — mesma tela
// centrada (fsa-hero-bg) das páginas de login, não a navbar de trabalho.
definePageMeta({ middleware: 'require-role', roles: ['INTERN'] });

// Formulário de 1º acesso do estagiário (autenticado via TOTVS, perfil ainda
// incompleto — ver middleware require-profile-complete). Mesmos campos do
// autocadastro público antigo, menos identidade (nome já veio do TOTVS;
// e-mail/RA/telefone viram opcionais aqui, porque a conta pode ter sido
// auto-provisionada sem eles).
const PERIODOS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];
const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

const { user } = useAuth();
const store = useAuthStore();
const complete = useCompleteInternProfile();
const options = useRegistrationOptions();
const term = useResponsibilityTerm();

const form = reactive({
  ra: '',
  phone: '',
  email: '',
  academicSupervisorId: '',
  pendingSupervisorName: '',
  disciplinaId: '',
  periodo: '',
  turma: '',
});
const windows = ref<AvailabilityWindowValue[]>([{ weekday: 1, startTime: '', endTime: '' }]);
const termModalOpen = ref(false);
const termOpened = ref(false);
const termAccepted = ref(false);
const isOther = computed(() => form.academicSupervisorId === 'OUTRO');

function onInputRa(e: Event) {
  form.ra = applyMask(e, maskRA);
}

function openTermModal() {
  termModalOpen.value = true;
  termOpened.value = true;
}

async function handleLogout() {
  try {
    await api.post('/auth/logout');
  } finally {
    store.clear();
    await navigateTo('/portal', { replace: true });
  }
}

function onSubmit() {
  if (!termAccepted.value || !term.data.value) return;
  complete.mutate(
    {
      ra: form.ra || undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      ...(isOther.value
        ? { pendingSupervisorName: form.pendingSupervisorName }
        : { academicSupervisorId: form.academicSupervisorId }),
      disciplinaId: form.disciplinaId,
      periodo: form.periodo || undefined,
      turma: form.turma || undefined,
      windows: windows.value,
      acceptedTermVersion: term.data.value.version,
    },
    {
      onSuccess: () => {
        store.setProfileComplete(true);
        navigateTo('/', { replace: true });
      },
    },
  );
}
</script>

<template>
  <div class="fsa-hero-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-xl rounded-lg border border-border bg-surface p-8 shadow-sm">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 class="mb-1 text-xl font-semibold text-body">Complete seu cadastro</h1>
          <p class="text-sm text-muted">
            {{ user?.fullName ? `Olá, ${user.fullName}. ` : '' }}
            Falta só isso pra liberar o acesso — disciplina, supervisor, disponibilidade e o termo de responsabilidade.
          </p>
        </div>
        <button type="button" class="shrink-0 text-sm text-muted hover:underline" @click="handleLogout">Sair</button>
      </div>
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block text-sm">
            <span class="mb-1 block font-medium text-body">RA (6 dígitos)</span>
            <input
              :value="form.ra"
              :class="inputClass"
              :maxlength="MASK_LENGTH.ra"
              inputmode="numeric"
              placeholder="123456"
              @input="onInputRa"
            >
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium text-body">E-mail de contato</span>
            <input v-model="form.email" type="email" :class="inputClass" placeholder="voce@exemplo.br">
          </label>
          <PhoneField v-model="form.phone" label="Telefone" />

          <label class="block text-sm">
            <span class="mb-1 block font-medium text-body">Supervisor(a)</span>
            <select v-model="form.academicSupervisorId" :class="inputClass" required>
              <option value="">Selecione…</option>
              <option v-for="s in options.data.value?.supervisors" :key="s.id" :value="s.id">{{ s.fullName }}</option>
              <option value="OUTRO">Outro (ainda não cadastrado)</option>
            </select>
          </label>
          <label v-if="isOther" class="block text-sm">
            <span class="mb-1 block font-medium text-body">Nome do supervisor</span>
            <input v-model="form.pendingSupervisorName" :class="inputClass" placeholder="Nome completo do supervisor" required>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium text-body">Disciplina</span>
            <select v-model="form.disciplinaId" :class="inputClass" required>
              <option value="">Selecione…</option>
              <option v-for="d in options.data.value?.disciplinas" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium text-body">Período</span>
            <select v-model="form.periodo" :class="inputClass">
              <option value="">Selecione…</option>
              <option v-for="p in PERIODOS" :key="p" :value="p">{{ p }} período</option>
            </select>
          </label>
          <label class="block text-sm">
            <span class="mb-1 block font-medium text-body">Turma</span>
            <input v-model="form.turma" :class="inputClass" placeholder="Ex.: A, Noturno">
          </label>
        </div>

        <p v-if="options.data.value && options.data.value.supervisors.length === 0" class="text-xs text-warn">
          Nenhum supervisor cadastrado ainda — peça à coordenação para cadastrar.
        </p>

        <div>
          <p class="mb-1 text-sm font-semibold text-body">Disponibilidade para atender</p>
          <p class="mb-2 text-xs text-muted">
            Informe os dias e horários em que você está disponível para atender.
            <strong class="text-body">Este não é o agendamento da consulta</strong> — é a sua disponibilidade
            recorrente; a clínica marca as consultas dentro desses horários.
          </p>
          <WeeklyAvailabilityPicker v-model="windows" />
        </div>

        <div class="rounded-md border border-border bg-surface2 p-4">
          <button type="button" class="text-sm font-medium text-link hover:underline" @click="openTermModal">
            Ler o termo de responsabilidade
          </button>
          <label class="mt-2 flex items-start gap-2 text-sm text-body">
            <input v-model="termAccepted" type="checkbox" class="mt-0.5" :disabled="!termOpened">
            <span>
              Li e aceito o contrato de responsabilidade.
              <span v-if="!termOpened" class="block text-xs text-muted">Abra o termo acima para habilitar.</span>
            </span>
          </label>
        </div>

        <p v-if="complete.isError.value" class="text-sm text-danger">
          Não foi possível salvar (verifique os campos e o e-mail, se informado).
        </p>
        <button
          type="submit"
          :disabled="complete.isPending.value || !termAccepted || !term.data.value"
          class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        >
          {{ complete.isPending.value ? 'Salvando…' : 'Concluir cadastro' }}
        </button>
      </form>
    </div>

    <BaseModal :open="termModalOpen" title="Termo de responsabilidade" @close="termModalOpen = false">
      <p v-if="term.isLoading.value" class="text-sm text-muted">Carregando…</p>
      <p v-else-if="term.isError.value" class="text-sm text-danger">Não foi possível carregar o termo agora. Tente novamente.</p>
      <div v-else-if="term.data.value" class="whitespace-pre-wrap text-sm text-body">{{ term.data.value.content }}</div>
    </BaseModal>
  </div>
</template>
