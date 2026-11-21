<script setup lang="ts">
import { useMatches } from '../composables/useMatching';
import type { MatchView } from '../composables/useMatching';

// Consultas dos pares, só leitura (painel do supervisor). UM card por par
// (estagiário ↔ paciente): o mesmo par tem uma consulta por semana do
// período, e listar consulta por consulta fazia o paciente parecer
// repetido. O admin não usa esta lista — no pareamento ele vê as propostas
// (MatchProposals) e, depois de salvas, os pares ficam em Vínculos.
const STATUS_PILL: Record<string, string> = {
  SCHEDULED: 'pill-info',
  ATTENDED: 'pill-ok',
  NO_SHOW: 'pill-warn',
  CANCELLED: 'pill-muted',
};
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  ATTENDED: 'Compareceu',
  NO_SHOW: 'Faltou',
  CANCELLED: 'Cancelada',
};
const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const matches = useMatches();

interface Pair {
  key: string;
  internName: string;
  patientCode: string;
  /** Próxima consulta agendada (null se não há mais nenhuma). */
  next: MatchView | null;
  /** O restante da série (as consultas vêm em ordem de data). */
  others: MatchView[];
  attended: number;
}

const pairs = computed<Pair[]>(() => {
  const byKey = new Map<string, MatchView[]>();
  for (const m of matches.data.value ?? []) {
    const key = `${m.internId}|${m.patientCode}`;
    byKey.set(key, [...(byKey.get(key) ?? []), m]);
  }
  return [...byKey.entries()].map(([key, list]) => {
    const next = list.find((m) => m.status === 'SCHEDULED') ?? null;
    return {
      key,
      internName: list[0]!.internName,
      patientCode: list[0]!.patientCode,
      next,
      others: list.filter((m) => m !== next),
      attended: list.filter((m) => m.status === 'ATTENDED').length,
    };
  });
});

const expanded = reactive<Record<string, boolean>>({});

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
function weeklyLabel(iso: string) {
  const d = new Date(iso);
  return `Toda ${WEEKDAY[d.getDay()]}, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}
</script>

<template>
  <section>
    <h2 class="mb-4 text-lg font-semibold text-body">Pareamentos e consultas</h2>

    <p v-if="matches.data.value && pairs.length === 0" class="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
      Nenhum pareamento ainda.
    </p>

    <ul class="space-y-2">
      <li v-for="p in pairs" :key="p.key" class="rounded-lg border border-border bg-surface p-4 shadow-sm">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <p class="text-sm font-medium text-body">
            {{ p.internName }} <span class="text-muted">↔</span> Paciente <span class="font-mono">Nº {{ p.patientCode }}</span>
          </p>
          <p class="text-xs text-muted">
            <span v-if="p.next">{{ weeklyLabel(p.next.scheduledAt) }} · </span>
            {{ p.attended }} realizada(s)
          </p>
        </div>

        <template v-for="m in expanded[p.key] ? [p.next, ...p.others] : [p.next]" :key="m?.appointmentId ?? 'none'">
          <div v-if="m" class="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <p class="text-xs text-muted">
              {{ formatDateTime(m.scheduledAt) }}
              <span v-if="m.roomName"> · {{ m.roomName }}</span>
              <span v-else-if="m.status === 'SCHEDULED'"> · sem sala</span>
            </p>
            <span class="pill" :class="STATUS_PILL[m.status] ?? 'pill-muted'">{{ STATUS_LABEL[m.status] ?? m.status }}</span>
          </div>
        </template>

        <button
          v-if="p.others.length > 0"
          type="button"
          class="mt-3 text-xs font-medium text-link hover:underline"
          @click="expanded[p.key] = !expanded[p.key]"
        >
          {{ expanded[p.key] ? 'Mostrar só a próxima' : `Ver todas as consultas (${p.others.length + (p.next ? 1 : 0)})` }}
        </button>
      </li>
    </ul>
  </section>
</template>
