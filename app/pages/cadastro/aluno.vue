<script setup lang="ts">
import { maskRA } from '../../shared/lib/masks';
import { useRegisterStudent, useRegistrationOptions, useResponsibilityTerm } from '../../composables/useEnrollment';
import type { AvailabilityWindowValue } from '../../components/WeeklyAvailabilityPicker.vue';

// Página PÚBLICA: o aluno se cadastra escolhendo supervisor, disciplina, período e turma.
const PERIODOS = ['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º'];
const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

const reg = useRegisterStudent();
const options = useRegistrationOptions();
const term = useResponsibilityTerm();

const form = reactive({
  fullName: '',
  email: '',
  ra: '',
  password: '',
  phone: '',
  academicSupervisorId: '',
  pendingSupervisorName: '',
  disciplinaId: '',
  periodo: '',
  turma: '',
});
const windows = ref<AvailabilityWindowValue[]>([{ weekday: 1, startTime: '', endTime: '' }]);
const termModalOpen = ref(false);
const termOpened = ref(false); // já abriu o modal ao menos uma vez
const termAccepted = ref(false);
const isOther = computed(() => form.academicSupervisorId === 'OUTRO');

function onInputRa(e: Event) {
  form.ra = maskRA((e.target as HTMLInputElement).value);
}

function openTermModal() {
  termModalOpen.value = true;
  termOpened.value = true;
}

function onSubmit() {
  if (!termAccepted.value || !term.data.value) return;
  reg.mutate({
    fullName: form.fullName,
    email: form.email,
    ra: form.ra,
    password: form.password,
    phone: form.phone || undefined,
    ...(isOther.value ? { pendingSupervisorName: form.pendingSupervisorName } : { academicSupervisorId: form.academicSupervisorId }),
    disciplinaId: form.disciplinaId,
    periodo: form.periodo || undefined,
    turma: form.turma || undefined,
    windows: windows.value,
    acceptedTermVersion: term.data.value.version,
  });
}
</script>

<template>
  <div class="fsa-hero-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-xl rounded-lg border border-border bg-surface p-8 shadow-sm">
      <template v-if="reg.isSuccess.value">
        <h1 class="mb-2 text-xl font-semibold text-body">Cadastro realizado!</h1>
        <p class="mb-4 text-sm text-muted">
          Seu perfil de estagiário foi criado. O login agora é feito com seu usuário e senha institucionais (TOTVS
          RM) — no primeiro acesso, informe também o e-mail <strong class="text-body">{{ form.email }}</strong> (o
          que você acabou de cadastrar) para vincular esta conta.
        </p>
        <NuxtLink to="/login-estagiario" class="font-medium text-link hover:underline">Ir para o login do estagiário</NuxtLink>
      </template>
      <template v-else>
        <h1 class="mb-1 text-xl font-semibold text-body">Cadastro de estagiário</h1>
        <p class="mb-6 text-sm text-muted">Clínica de Psicologia — COEPP / Fundação Santo André</p>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">Nome completo</span>
              <input v-model="form.fullName" :class="inputClass" required>
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">RA (6 dígitos)</span>
              <input :value="form.ra" :class="inputClass" placeholder="123456" required @input="onInputRa">
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">E-mail</span>
              <input v-model="form.email" type="email" :class="inputClass" required>
            </label>
            <PhoneField v-model="form.phone" label="Telefone" />
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">Senha (mín. 8)</span>
              <input v-model="form.password" type="password" :class="inputClass" minlength="8" required>
            </label>

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

          <p v-if="reg.isError.value" class="text-sm text-danger">Não foi possível cadastrar (verifique os campos e o RA/e-mail).</p>
          <button
            type="submit"
            :disabled="reg.isPending.value || !termAccepted || !term.data.value"
            class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
          >
            {{ reg.isPending.value ? 'Enviando…' : 'Criar cadastro' }}
          </button>
          <p class="text-center text-sm text-muted">
            Já tem cadastro?
            <NuxtLink to="/login-estagiario" class="font-medium text-link hover:underline">Entrar</NuxtLink>
          </p>
        </form>
      </template>
    </div>

    <BaseModal :open="termModalOpen" title="Termo de responsabilidade" @close="termModalOpen = false">
      <p v-if="term.isLoading.value" class="text-sm text-muted">Carregando…</p>
      <p v-else-if="term.isError.value" class="text-sm text-danger">Não foi possível carregar o termo agora. Tente novamente.</p>
      <div v-else-if="term.data.value" class="whitespace-pre-wrap text-sm text-body">{{ term.data.value.content }}</div>
    </BaseModal>
  </div>
</template>
