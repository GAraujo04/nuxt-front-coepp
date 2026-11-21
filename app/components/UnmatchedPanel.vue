<script setup lang="ts">
import { useManualMatchPick, useUnmatched } from '../composables/useMatching';
import { formatWindow } from '../shared/lib/weekdays';

// Painel Admin: quem ficou sem par — pacientes sem vínculo nem proposta e
// estagiários sem nenhum paciente —, com os horários de cada um. Serve de
// base para a conversa com eles e o pareamento manual: "Parear
// manualmente" preenche o formulário do match manual logo abaixo.
// Ninguém precisa ser "marcado como resolvido": ao ganhar par, sai da lista.
const unmatched = useUnmatched();
const pick = useManualMatchPick();

const patients = computed(() => unmatched.data.value?.patients ?? []);
const interns = computed(() => unmatched.data.value?.interns ?? []);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}
function choose(field: 'patientId' | 'internId', id: string) {
  pick.value = { ...pick.value, [field]: id };
  document.getElementById('match-manual')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <section class="mt-8 space-y-4 border-t border-border pt-6">
    <div>
      <h2 class="text-lg font-semibold text-body">Sem pareamento</h2>
      <p class="text-sm text-muted">
        Pacientes e alunos que não encaixaram com ninguém, com os horários disponíveis. Converse com eles e faça o
        pareamento manual.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div>
        <h3 class="mb-2 text-sm font-semibold text-body">
          Pacientes <span class="pill pill-warn ml-1">{{ patients.length }}</span>
        </h3>
        <p v-if="unmatched.isSuccess.value && patients.length === 0" class="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
          Todos os pacientes estão pareados.
        </p>
        <ul class="space-y-2">
          <li v-for="p in patients" :key="p.id" class="rounded-lg border border-border bg-surface p-3 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="text-sm font-medium text-body">
                  Paciente <span class="font-mono">Nº {{ p.code }}</span>
                  <span v-if="p.isMinor" class="pill pill-info ml-1">Menor</span>
                  <span v-if="p.hasDisability" class="pill pill-info ml-1">PcD</span>
                </p>
                <p class="text-xs text-muted">
                  {{ p.noMatchSince ? `Sem horário compatível desde ${formatDate(p.noMatchSince)}` : `Cadastrado em ${formatDate(p.registeredAt)} — ainda não passou pelo pareamento` }}
                </p>
              </div>
              <button
                type="button"
                class="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium text-body hover:bg-surface2"
                @click="choose('patientId', p.id)"
              >
                Parear manualmente
              </button>
            </div>
            <ul v-if="p.windows.length" class="mt-2 flex flex-wrap gap-1.5">
              <li v-for="w in p.windows" :key="`${w.weekday}-${w.startTime}`" class="rounded-md bg-surface2 px-2 py-1 text-xs text-body">
                {{ formatWindow(w) }}
              </li>
            </ul>
            <p v-else class="mt-2 text-xs text-muted">Nenhum horário informado.</p>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="mb-2 text-sm font-semibold text-body">
          Alunos <span class="pill pill-warn ml-1">{{ interns.length }}</span>
        </h3>
        <p v-if="unmatched.isSuccess.value && interns.length === 0" class="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted">
          Todos os alunos têm paciente.
        </p>
        <ul class="space-y-2">
          <li v-for="i in interns" :key="i.id" class="rounded-lg border border-border bg-surface p-3 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <p class="text-sm font-medium text-body">
                {{ i.name }} <span v-if="i.ra" class="font-mono text-xs text-muted">RA {{ i.ra }}</span>
              </p>
              <button
                type="button"
                class="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-medium text-body hover:bg-surface2"
                @click="choose('internId', i.id)"
              >
                Parear manualmente
              </button>
            </div>
            <ul v-if="i.windows.length" class="mt-2 flex flex-wrap gap-1.5">
              <li v-for="w in i.windows" :key="`${w.weekday}-${w.startTime}`" class="rounded-md bg-surface2 px-2 py-1 text-xs text-body">
                {{ formatWindow(w) }}
              </li>
            </ul>
            <p v-else class="mt-2 text-xs text-muted">Ainda não cadastrou a disponibilidade.</p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
