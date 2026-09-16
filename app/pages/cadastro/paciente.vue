<script setup lang="ts">
import { applyMask, BIRTH_DATE_MIN, maskCPF, MASK_LENGTH, todayISO } from '../../shared/lib/masks';
import { useRegisterPatient } from '../../composables/useEnrollment';
import type { AvailabilityWindowValue } from '../../components/WeeklyAvailabilityPicker.vue';
import type { PatientSelfReg } from '../../composables/useEnrollment';

// Página PÚBLICA: o paciente se cadastra (com login), informa disponibilidade.
const DISABILITY_TYPES: { value: string; label: string }[] = [
  { value: 'FISICA', label: 'Física' },
  { value: 'VISUAL', label: 'Visual' },
  { value: 'AUDITIVA', label: 'Auditiva' },
  { value: 'INTELECTUAL', label: 'Intelectual' },
  { value: 'PSICOSSOCIAL', label: 'Psicossocial' },
  { value: 'MULTIPLA', label: 'Múltipla' },
  { value: 'OUTRA', label: 'Outra' },
];
const inputClass =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

function ageFrom(d: string): number | null {
  if (!d) return null;
  const b = new Date(d);
  if (Number.isNaN(b.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

const reg = useRegisterPatient();
const form = reactive({ fullName: '', email: '', cpf: '', birthDate: '', phone: '', gName: '', gCpf: '', gRel: '', gPhone: '' });
const windows = ref<AvailabilityWindowValue[]>([{ weekday: 1, startTime: '', endTime: '' }]);
const hasDisability = ref(false);
const disabilityTypes = ref<string[]>([]);
const disabilityOtherText = ref('');

const age = computed(() => ageFrom(form.birthDate));
const isMinor = computed(() => age.value !== null && age.value < 18);

function toggleDisabilityType(value: string) {
  disabilityTypes.value = disabilityTypes.value.includes(value)
    ? disabilityTypes.value.filter((t) => t !== value)
    : [...disabilityTypes.value, value];
}

function onChangeHasDisability(value: boolean) {
  hasDisability.value = value;
  if (!value) {
    disabilityTypes.value = [];
    disabilityOtherText.value = '';
  }
}

function onInputCpf(e: Event) {
  form.cpf = applyMask(e, maskCPF);
}
function onInputGCpf(e: Event) {
  form.gCpf = applyMask(e, maskCPF);
}

function onSubmit() {
  const payload: PatientSelfReg = {
    fullName: form.fullName,
    email: form.email,
    cpf: form.cpf,
    birthDate: form.birthDate,
    phone: form.phone || undefined,
    windows: windows.value,
    ...(isMinor.value
      ? { guardian: { name: form.gName, cpf: form.gCpf || undefined, relationship: form.gRel || undefined, phone: form.gPhone || undefined } }
      : {}),
    hasDisability: hasDisability.value,
    ...(hasDisability.value
      ? {
          disabilityTypes: disabilityTypes.value,
          disabilityOtherText: disabilityTypes.value.includes('OUTRA') ? disabilityOtherText.value : undefined,
        }
      : {}),
  };
  reg.mutate(payload);
}
</script>

<template>
  <div class="fsa-hero-bg flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-xl rounded-lg border border-border bg-surface p-8 shadow-sm">
      <template v-if="reg.isSuccess.value">
        <h1 class="mb-2 text-xl font-semibold text-body">Cadastro realizado!</h1>
        <p v-if="reg.data.value?.code" class="mb-2 text-sm text-body">
          Seu código de paciente: <span class="font-mono font-semibold">{{ reg.data.value.code }}</span>
        </p>
        <p class="mb-4 text-sm text-muted">
          Seu cadastro foi criado. Para acompanhar a data da sua consulta, entre com seu
          <strong>CPF e data de nascimento</strong>.
        </p>
        <NuxtLink to="/login-paciente" class="font-medium text-link hover:underline">Ir para o login do paciente</NuxtLink>
      </template>
      <template v-else>
        <h1 class="mb-1 text-xl font-semibold text-body">Cadastro de paciente</h1>
        <p class="mb-6 text-sm text-muted">Clínica de Psicologia — COEPP / Fundação Santo André</p>
        <form class="space-y-4" @submit.prevent="onSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">Nome completo</span>
              <input v-model="form.fullName" :class="inputClass" required>
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">CPF (será seu login)</span>
              <input
                :value="form.cpf"
                :class="inputClass"
                :maxlength="MASK_LENGTH.cpf"
                inputmode="numeric"
                placeholder="000.000.000-00"
                required
                @input="onInputCpf"
              >
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">Data de nascimento (login)</span>
              <input
                v-model="form.birthDate"
                type="date"
                :class="inputClass"
                :min="BIRTH_DATE_MIN"
                :max="todayISO()"
                required
              >
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">E-mail (para avisos da consulta)</span>
              <input v-model="form.email" type="email" :class="inputClass" required>
            </label>
            <PhoneField v-model="form.phone" label="Telefone" />
          </div>

          <div v-if="isMinor" class="rounded-md border border-border bg-surface2 p-4">
            <p class="mb-3 text-sm font-semibold text-body">
              Responsável legal <span class="font-normal text-muted">(menor de idade — {{ age }} anos)</span>
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block text-sm">
                <span class="mb-1 block font-medium text-body">Nome do responsável</span>
                <input v-model="form.gName" :class="inputClass" required>
              </label>
              <label class="block text-sm">
                <span class="mb-1 block font-medium text-body">Parentesco</span>
                <input v-model="form.gRel" :class="inputClass" placeholder="Mãe, Pai…">
              </label>
              <label class="block text-sm">
                <span class="mb-1 block font-medium text-body">CPF do responsável</span>
                <input
                  :value="form.gCpf"
                  :class="inputClass"
                  :maxlength="MASK_LENGTH.cpf"
                  inputmode="numeric"
                  placeholder="000.000.000-00"
                  @input="onInputGCpf"
                >
              </label>
              <PhoneField v-model="form.gPhone" label="Telefone do responsável" />
            </div>
          </div>

          <div class="rounded-md border border-border bg-surface2 p-4">
            <p class="mb-2 text-sm font-semibold text-body">Possui deficiência?</p>
            <div class="flex gap-4 text-sm text-body">
              <label class="flex items-center gap-2">
                <input type="radio" name="hasDisability" :checked="!hasDisability" @change="onChangeHasDisability(false)">
                Não
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="hasDisability" :checked="hasDisability" @change="onChangeHasDisability(true)">
                Sim
              </label>
            </div>

            <div v-if="hasDisability" class="mt-3">
              <p class="mb-2 text-xs text-muted">Selecione um ou mais tipos.</p>
              <div class="grid gap-2 sm:grid-cols-2">
                <label v-for="t in DISABILITY_TYPES" :key="t.value" class="flex items-center gap-2 text-sm text-body">
                  <input type="checkbox" :checked="disabilityTypes.includes(t.value)" @change="toggleDisabilityType(t.value)">
                  {{ t.label }}
                </label>
              </div>
              <label v-if="disabilityTypes.includes('OUTRA')" class="mt-3 block text-sm">
                <span class="mb-1 block font-medium text-body">Descreva</span>
                <input v-model="disabilityOtherText" :class="inputClass" required>
              </label>
            </div>
          </div>

          <div>
            <p class="mb-1 text-sm font-semibold text-body">Disponibilidade para atendimento</p>
            <p class="mb-2 text-xs text-muted">
              Informe os dias e horários em que você está disponível para ser atendido.
              <strong class="text-body">Este não é o agendamento da consulta</strong> — é a sua disponibilidade
              recorrente; a clínica marca a consulta dentro desses horários.
            </p>
            <WeeklyAvailabilityPicker v-model="windows" />
          </div>

          <p v-if="reg.isError.value" class="text-sm text-danger">
            Não foi possível enviar o cadastro. Verifique os campos (e-mail já usado? formato do CPF/telefone?).
          </p>
          <button
            type="submit"
            :disabled="reg.isPending.value"
            class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
          >
            {{ reg.isPending.value ? 'Enviando…' : 'Criar cadastro' }}
          </button>
          <p class="text-center text-sm text-muted">
            Já tem cadastro?
            <NuxtLink to="/login-paciente" class="font-medium text-link hover:underline">Entrar</NuxtLink>
          </p>
        </form>
      </template>
    </div>
  </div>
</template>
