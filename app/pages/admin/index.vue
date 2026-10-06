<script setup lang="ts">
import { applyMask, maskCRP, MASK_LENGTH } from '../../shared/lib/masks';
import { useCreateUser, useUsersByRole } from '../../composables/useUsers';
import { usePatients } from '../../composables/usePatients';
import type { CreateUserPayload } from '../../composables/useUsers';

definePageMeta({ layout: 'authenticated', middleware: 'require-role', roles: ['ADMIN'] });

// Painel Administrativo: lista de usuários + cadastro de supervisor +
// pareamento + vínculos. Pacientes e alunos se autocadastram (não passam
// mais pelo admin). Equivalente a features/admin/pages/AdminDashboard.tsx —
// a página mais "hub" da migração: 5 abas, 4 delas cada uma fechando uma
// sub-slice inteira (assignments, disciplinas, rooms, matching).
const TAB_LABEL = {
  users: 'Usuários',
  disciplinas: 'Disciplinas',
  matching: 'Pareamento',
  assignments: 'Vínculos',
  rooms: 'Salas',
} as const;
type Tab = keyof typeof TAB_LABEL;
const TABS = Object.keys(TAB_LABEL) as Tab[];

const EMPTY = { fullName: '', email: '', password: '', phone: '', crp: '', department: '' };
const inputClass = 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

const tab = ref<Tab>('users');
const form = reactive({ ...EMPTY });
const create = useCreateUser();
const interns = useUsersByRole('INTERN');
const supervisors = useUsersByRole('SUPERVISOR');
const patients = usePatients();

function onInputCrp(e: Event) {
  form.crp = applyMask(e, maskCRP);
}

function onSubmit() {
  const payload: CreateUserPayload = {
    role: 'SUPERVISOR',
    fullName: form.fullName,
    email: form.email,
    password: form.password,
    phone: form.phone || undefined,
    crp: form.crp,
    department: form.department || undefined,
  };
  create.mutate(payload, { onSuccess: () => Object.assign(form, EMPTY) });
}
</script>

<template>
  <section class="space-y-6">
    <div class="flex gap-2 border-b border-border pb-3">
      <button
        v-for="tb in TABS"
        :key="tb"
        class="rounded-md px-3 py-1.5 text-sm font-semibold"
        :class="tab === tb ? 'bg-primary text-onprimary' : 'text-muted hover:text-body'"
        @click="tab = tb"
      >
        {{ TAB_LABEL[tb] }}
      </button>
    </div>

    <DisciplinasAdmin v-if="tab === 'disciplinas'" />
    <template v-else-if="tab === 'matching'">
      <PendingMatchAlerts />
      <MatchesList can-run />
      <ManualMatchPanel />
    </template>
    <AssignmentsAdmin v-else-if="tab === 'assignments'" />
    <RoomsAdmin v-else-if="tab === 'rooms'" />

    <div v-else-if="tab === 'users'" class="space-y-8">
      <div>
        <h1 class="mb-1 text-lg font-semibold text-body">Cadastrar supervisor</h1>
        <p class="mb-4 text-sm text-muted">Pacientes e alunos se cadastram pelos links públicos.</p>
        <form class="max-w-xl space-y-4 rounded-lg border border-border bg-surface p-6 shadow-sm" @submit.prevent="onSubmit">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">Nome completo</span>
              <input v-model="form.fullName" :class="inputClass" required>
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">E-mail</span>
              <input v-model="form.email" type="email" :class="inputClass" required>
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">Senha provisória</span>
              <input v-model="form.password" type="password" :class="inputClass" minlength="8" required>
            </label>
            <PhoneField v-model="form.phone" label="Telefone" />
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">CRP</span>
              <input
                :value="form.crp"
                :class="inputClass"
                :maxlength="MASK_LENGTH.crp"
                inputmode="numeric"
                placeholder="06/123456"
                required
                @input="onInputCrp"
              >
            </label>
            <label class="block text-sm">
              <span class="mb-1 block font-medium text-body">Departamento</span>
              <input v-model="form.department" :class="inputClass">
            </label>
          </div>
          <p v-if="create.isError.value" class="text-sm text-danger">Não foi possível cadastrar (verifique e-mail/CRP).</p>
          <p v-if="create.isSuccess.value" class="text-sm text-ok">Supervisor cadastrado com sucesso.</p>
          <button
            type="submit"
            :disabled="create.isPending.value"
            class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
          >
            {{ create.isPending.value ? 'Cadastrando…' : 'Cadastrar supervisor' }}
          </button>
        </form>
      </div>

      <PendingSupervisors :supervisors="supervisors.data.value" />

      <AvailabilityRequests />

      <div class="grid gap-6 lg:grid-cols-3">
        <AdminList title="Estagiários" :rows="interns.data.value?.map((u) => ({ id: u.id, main: u.fullName, sub: `RA ${u.ra ?? '—'}` }))" />
        <AdminList title="Supervisores" :rows="supervisors.data.value?.map((s) => ({ id: s.id, main: s.fullName, sub: `CRP ${s.crp ?? '—'}` }))" />
        <AdminList title="Pacientes" :rows="patients.data.value?.map((p) => ({ id: p.id, main: `${p.code} — ${p.fullName}`, sub: p.isMinor ? 'Menor' : 'Adulto' }))" />
      </div>
    </div>
  </section>
</template>
