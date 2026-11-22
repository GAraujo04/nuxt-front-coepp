<script setup lang="ts">
import { useConfirmProposal, useDiscardProposal, useMatchProposals, useRunMatching } from '../composables/useMatching';
import type { MatchProposal } from '../composables/useMatching';
import { useRooms } from '../composables/useRooms';
import { apiErrorCode } from '../shared/api/error-code';

// Painel Admin: propostas do pareamento. "Rodar pareamento" só PROPÕE
// (estagiário ↔ paciente, horário fixo, sala); nada vira vínculo até o admin
// salvar. Salvar cria o vínculo com a agenda semanal até o fim do período e
// tira o par daqui — dali em diante ele aparece em Vínculos. Cancelar
// descarta a proposta sem deixar vínculo nem consulta.
const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const fieldClass =
  'rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-body focus:border-link focus:outline-none';

const proposals = useMatchProposals();
const run = useRunMatching();
const confirm = useConfirmProposal();
const discard = useDiscardProposal();
const rooms = useRooms();
// O pareamento só propõe par com sala livre: sem sala cadastrada, nada sai.
const noRooms = computed(() => rooms.isSuccess.value && (rooms.data.value?.length ?? 0) === 0);

/** ISO -> valor de <input type="datetime-local"> no fuso local. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function weeklyLabel(local: string) {
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return '';
  return `Toda ${WEEKDAY[d.getDay()]}, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

// Ajustes que o admin fez no card antes de salvar; sem ajuste, vale o proposto.
const drafts = reactive(new Map<string, { when: string; roomId: string }>());

function draftOf(p: MatchProposal) {
  return drafts.get(p.id) ?? { when: toLocalInput(p.scheduledAt), roomId: p.roomId ?? '' };
}
function setDraft(p: MatchProposal, field: 'when' | 'roomId', value: string) {
  drafts.set(p.id, { ...draftOf(p), [field]: value });
}
function save(p: MatchProposal) {
  const d = draftOf(p);
  confirm.mutate(
    // datetime-local é hora local; o toISOString manda o instante em UTC.
    { id: p.id, scheduledAt: new Date(d.when).toISOString(), roomId: d.roomId || null },
    { onSuccess: () => drafts.delete(p.id) },
  );
}
function onDiscard(p: MatchProposal) {
  if (!window.confirm(`Cancelar a proposta de ${p.internName} com o paciente Nº ${p.patientCode}?`)) return;
  discard.mutate(p.id, { onSuccess: () => drafts.delete(p.id) });
}
</script>

<template>
  <section>
    <div class="mb-1 flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold text-body">Pareamento</h2>
      <button
        :disabled="run.isPending.value || noRooms"
        class="rounded-md bg-primary px-3 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-60"
        @click="run.mutate()"
      >
        {{ run.isPending.value ? 'Pareando…' : 'Rodar pareamento' }}
      </button>
    </div>
    <p class="mb-4 text-sm text-muted">
      Confira cada proposta e salve: o par passa a ser atendido toda semana nesse dia e horário até o fim do período, e
      sai desta lista para Vínculos. Cancelar descarta a proposta.
    </p>

    <p v-if="noRooms" class="mb-3 rounded-md border border-warn/40 bg-surface2 p-3 text-sm text-body">
      Nenhuma sala cadastrada. O pareamento só forma pares com sala livre — cadastre as salas na aba
      <NuxtLink to="/admin?tab=rooms" class="font-medium text-link hover:underline">Salas</NuxtLink> antes de rodar.
    </p>
    <p v-if="run.isError.value" class="mb-3 text-sm text-danger">
      {{
        apiErrorCode(run.error.value) === 'validation_failed'
          ? 'Cadastre ao menos uma sala ativa antes de rodar o pareamento.'
          : 'Não foi possível rodar o pareamento. Tente novamente.'
      }}
    </p>
    <p v-if="run.isSuccess.value" class="mb-3 text-sm text-ok">
      {{ run.data.value && run.data.value.matched > 0 ? `${run.data.value.matched} nova(s) proposta(s).` : 'Nenhuma proposta nova (sem horários coincidentes).' }}
    </p>
    <p v-if="confirm.isSuccess.value" class="mb-3 text-sm text-ok">Pareamento salvo — o par agora está em Vínculos.</p>
    <p v-if="confirm.isError.value" class="mb-3 text-sm text-danger">
      {{
        apiErrorCode(confirm.error.value) === 'conflict'
          ? 'Não foi possível salvar: a sala está ocupada nesse horário ou o paciente já tem vínculo. Ajuste e tente de novo.'
          : 'Não foi possível salvar. Confira a data — ela precisa estar no futuro.'
      }}
    </p>
    <p v-if="discard.isError.value" class="mb-3 text-sm text-danger">Não foi possível cancelar a proposta. Tente novamente.</p>

    <p
      v-if="proposals.data.value && proposals.data.value.length === 0"
      class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted"
    >
      Nenhuma proposta aguardando. Rode o pareamento quando houver pacientes e estagiários com horários coincidentes.
    </p>

    <ul class="space-y-2">
      <li v-for="p in proposals.data.value" :key="p.id" class="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm font-medium text-body">
            {{ p.internName }} <span class="text-muted">↔</span> Paciente <span class="font-mono">Nº {{ p.patientCode }}</span>
          </p>
          <p class="text-xs text-muted">{{ weeklyLabel(draftOf(p).when) }}</p>
        </div>
        <form class="mt-3 flex flex-wrap items-center gap-2" @submit.prevent="save(p)">
          <input
            :value="draftOf(p).when"
            type="datetime-local"
            :class="fieldClass"
            aria-label="Primeira consulta"
            required
            @input="setDraft(p, 'when', ($event.target as HTMLInputElement).value)"
          >
          <select
            :value="draftOf(p).roomId"
            :class="fieldClass"
            aria-label="Sala"
            @change="setDraft(p, 'roomId', ($event.target as HTMLSelectElement).value)"
          >
            <option value="">Sem sala</option>
            <option v-for="r in rooms.data.value" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <button
            type="submit"
            :disabled="confirm.isPending.value"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            type="button"
            :disabled="discard.isPending.value"
            class="rounded-md border border-border px-3 py-1.5 text-sm text-danger hover:bg-surface2 disabled:opacity-50"
            @click="onDiscard(p)"
          >
            Cancelar
          </button>
        </form>
      </li>
    </ul>
  </section>
</template>
