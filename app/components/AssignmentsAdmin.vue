<script setup lang="ts">
import { useUsersByRole } from '../composables/useUsers';
import { useAssignments, useUpdateAssignment } from '../composables/useAssignments';
import type { AssignmentView } from '../composables/useAssignments';

// Painel Admin: lista os vínculos e permite alterar estagiário e/ou
// supervisor de um vínculo já existente. O primeiro vínculo nasce do
// pareamento (automático ou manual, já feito pelo sistema) — isto é a
// correção manual de um vínculo que já existe (estagiário saiu, supervisor
// mudou etc.), não a criação de um vínculo novo. Equivalente a
// features/assignments/pages/AssignmentsAdmin.tsx.
const selectClass = 'rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-body focus:border-link focus:outline-none';

const assignments = useAssignments();
const interns = useUsersByRole('INTERN');
const supervisors = useUsersByRole('SUPERVISOR');
const update = useUpdateAssignment();
const edited = reactive<Record<string, { internId?: string; supervisorId?: string }>>({});

function valueFor(a: AssignmentView, field: 'internId' | 'supervisorId') {
  return edited[a.id]?.[field] ?? (field === 'internId' ? a.internId : (a.supervisorId ?? ''));
}
function setValue(id: string, field: 'internId' | 'supervisorId', value: string) {
  edited[id] = { ...edited[id], [field]: value };
}
function isDirty(a: AssignmentView) {
  const e = edited[a.id];
  if (!e) return false;
  return (e.internId !== undefined && e.internId !== a.internId) || (e.supervisorId !== undefined && e.supervisorId !== (a.supervisorId ?? ''));
}
function end(a: AssignmentView) {
  // Confirmação nativa: ação rara sobre a agenda, sem desfazer.
  if (!window.confirm(`Encerrar o vínculo de ${a.patientName} com ${a.internName}? As consultas futuras serão canceladas.`)) return;
  update.mutate({ id: a.id, active: false });
}
function save(a: AssignmentView) {
  const e = edited[a.id];
  if (!e) return;
  update.mutate(
    {
      id: a.id,
      ...(e.internId && e.internId !== a.internId ? { internId: e.internId } : {}),
      ...(e.supervisorId && e.supervisorId !== (a.supervisorId ?? '') ? { supervisorId: e.supervisorId } : {}),
    },
    { onSuccess: () => (edited[a.id] = {}) },
  );
}
</script>

<template>
  <section>
    <h2 class="mb-4 text-lg font-semibold text-body">Vínculos (paciente ↔ estagiário ↔ supervisor)</h2>
    <p class="mb-4 text-xs text-muted">
      O vínculo inicial é criado pelo pareamento (automático ou manual). Aqui você corrige um vínculo já existente —
      troca de estagiário ou de supervisor — ou o encerra. Ao trocar o estagiário, as consultas futuras passam para o
      novo, no mesmo horário; ao encerrar, elas são canceladas.
    </p>
    <p v-if="assignments.data.value && assignments.data.value.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      Nenhum vínculo ainda. Eles surgem do pareamento.
    </p>
    <p v-if="update.isError.value" class="mb-3 text-sm text-danger">Não foi possível salvar o vínculo. Atualize a página e tente novamente.</p>
    <ul class="space-y-2">
      <li v-for="a in assignments.data.value" :key="a.id" class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm">
        <p class="text-sm font-medium text-body">{{ a.patientName }}</p>
        <div class="flex flex-wrap items-center gap-2">
          <label class="text-xs text-muted">
            Estagiário
            <select :class="`${selectClass} ml-1`" :value="valueFor(a, 'internId')" @change="setValue(a.id, 'internId', ($event.target as HTMLSelectElement).value)">
              <option v-for="i in interns.data.value" :key="i.id" :value="i.id">{{ i.fullName }}</option>
            </select>
          </label>
          <label class="text-xs text-muted">
            Supervisor
            <!-- Sem opção "não atribuído": este seletor troca o supervisor, não
                 remove — desatribuir não faz parte do backend (update só
                 altera pra um valor novo). -->
            <select :class="`${selectClass} ml-1`" :value="valueFor(a, 'supervisorId')" @change="setValue(a.id, 'supervisorId', ($event.target as HTMLSelectElement).value)">
              <option v-if="!a.supervisorId" value="">Selecione…</option>
              <option v-for="s in supervisors.data.value" :key="s.id" :value="s.id">{{ s.fullName }}</option>
            </select>
          </label>
          <button
            :disabled="!isDirty(a) || update.isPending.value"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
            @click="save(a)"
          >
            Salvar
          </button>
          <button
            :disabled="update.isPending.value"
            class="rounded-md border border-border px-3 py-1.5 text-sm text-danger hover:bg-surface2 disabled:opacity-50"
            @click="end(a)"
          >
            Encerrar
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
