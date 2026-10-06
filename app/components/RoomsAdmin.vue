<script setup lang="ts">
import { apiErrorCode } from '../shared/api/error-code';
import {
  ROOM_CATEGORIES,
  ROOM_CATEGORY_LABEL,
  useCreateRoom,
  useReassignRoom,
  useRooms,
  useUpdateRoom,
} from '../composables/useRooms';
import type { RoomCategory } from '../composables/useRooms';

// Painel Admin: cadastro e categorização das salas, status (ocupada/
// disponível) e realocação manual. Equivalente a
// features/rooms/pages/RoomsAdmin.tsx, mais a gestão de salas.
//
// Sala não é excluída, é desativada: atendimentos antigos apontam para ela.
const rooms = useRooms({ includeInactive: true });
const create = useCreateRoom();
const update = useUpdateRoom();
const reassign = useReassignRoom();

const picked = reactive<Record<string, string>>({});
const form = reactive<{ name: string; category: RoomCategory }>({ name: '', category: 'PADRAO' });
const editing = ref<string | null>(null);
const draft = reactive<{ name: string; category: RoomCategory }>({ name: '', category: 'PADRAO' });

const activeRooms = computed(() => rooms.data.value?.filter((r) => r.active) ?? []);
const CATEGORY_PILL: Record<RoomCategory, string> = {
  PADRAO: 'pill-muted',
  ACESSIVEL: 'pill-info',
  INFANTIL: 'pill-warn',
  GRUPO: 'pill-ok',
};

const inputClass =
  'rounded-md border border-border bg-surface px-3 py-2 text-sm text-body focus:border-link focus:outline-none';

function errorText(error: unknown, fallback: string) {
  // O 409 de sala é ambíguo só na aparência: nome repetido no cadastro,
  // atendimento futuro na desativação, conflito de horário na realocação.
  return apiErrorCode(error) === 'conflict' ? fallback : 'Não foi possível salvar. Tente novamente.';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
function move(appointmentId: string) {
  const roomId = picked[appointmentId];
  if (roomId) reassign.mutate({ appointmentId, roomId });
}
function onCreate() {
  if (!form.name.trim()) return;
  create.mutate(
    { name: form.name.trim(), category: form.category },
    { onSuccess: () => Object.assign(form, { name: '', category: 'PADRAO' }) },
  );
}
function startEdit(id: string, name: string, category: RoomCategory) {
  editing.value = id;
  Object.assign(draft, { name, category });
}
function saveEdit(id: string) {
  update.mutate({ id, name: draft.name.trim(), category: draft.category }, { onSuccess: () => (editing.value = null) });
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <h2 class="mb-1 text-lg font-semibold text-body">Salas de atendimento</h2>
      <p class="mb-4 text-sm text-muted">
        A categoria orienta o pareamento: paciente com deficiência vai preferencialmente para sala adaptada, e criança
        para a sala infantil. Sem sala da categoria livre no horário, o sistema usa outra sala livre.
      </p>
      <form class="flex max-w-2xl flex-wrap gap-2" @submit.prevent="onCreate">
        <input v-model="form.name" :class="`${inputClass} min-w-48 flex-1`" placeholder="Nome da sala (ex.: Sala 12)" maxlength="60">
        <select v-model="form.category" :class="inputClass" aria-label="Categoria da nova sala">
          <option v-for="c in ROOM_CATEGORIES" :key="c" :value="c">{{ ROOM_CATEGORY_LABEL[c] }}</option>
        </select>
        <button
          type="submit"
          :disabled="create.isPending.value || !form.name.trim()"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
        >
          Adicionar sala
        </button>
      </form>
      <p v-if="create.isError.value" class="mt-2 text-sm text-danger">
        {{ errorText(create.error.value, 'Já existe uma sala com esse nome.') }}
      </p>
    </div>

    <p v-if="update.isError.value" class="text-sm text-danger">
      {{ errorText(update.error.value, 'Não foi possível salvar — nome repetido, ou a sala tem atendimentos futuros (realoque-os antes de desativar).') }}
    </p>
    <p v-if="reassign.isError.value" class="text-sm text-danger">
      Não foi possível realocar — a sala de destino provavelmente já está ocupada nesse horário.
    </p>

    <ul class="space-y-2">
      <li
        v-for="r in rooms.data.value"
        :key="r.id"
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 shadow-sm"
        :class="{ 'opacity-60': !r.active }"
      >
        <!-- Edição inline de nome/categoria -->
        <form v-if="editing === r.id" class="flex flex-1 flex-wrap items-center gap-2" @submit.prevent="saveEdit(r.id)">
          <input v-model="draft.name" :class="`${inputClass} min-w-40 flex-1`" maxlength="60" aria-label="Nome da sala">
          <select v-model="draft.category" :class="inputClass" aria-label="Categoria da sala">
            <option v-for="c in ROOM_CATEGORIES" :key="c" :value="c">{{ ROOM_CATEGORY_LABEL[c] }}</option>
          </select>
          <button
            type="submit"
            :disabled="update.isPending.value || !draft.name.trim()"
            class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
          >
            Salvar
          </button>
          <button type="button" class="rounded-md border border-border px-3 py-1.5 text-sm text-body hover:bg-surface2" @click="editing = null">
            Cancelar
          </button>
        </form>

        <template v-else>
          <div>
            <p class="flex flex-wrap items-center gap-2 text-sm font-medium text-body">
              {{ r.name }}
              <span class="pill" :class="CATEGORY_PILL[r.category]">{{ ROOM_CATEGORY_LABEL[r.category] }}</span>
              <span v-if="!r.active" class="pill pill-muted">Desativada</span>
              <span v-else class="pill" :class="r.occupiedBy ? 'pill-warn' : 'pill-ok'">{{ r.occupiedBy ? 'Ocupada' : 'Disponível' }}</span>
            </p>
            <p v-if="r.occupiedBy" class="text-xs text-muted">
              {{ r.occupiedBy.internName }} <span class="text-muted">↔</span> {{ r.occupiedBy.patientName }} — {{ formatDateTime(r.occupiedBy.scheduledAt) }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <template v-if="r.occupiedBy">
              <select
                class="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-body focus:border-link focus:outline-none"
                :value="picked[r.occupiedBy.appointmentId] ?? ''"
                @change="picked[r.occupiedBy.appointmentId] = ($event.target as HTMLSelectElement).value"
              >
                <option value="">Mover para…</option>
                <option v-for="other in activeRooms.filter((o) => o.id !== r.id)" :key="other.id" :value="other.id">
                  {{ other.name }} ({{ ROOM_CATEGORY_LABEL[other.category] }})
                </option>
              </select>
              <button
                :disabled="!picked[r.occupiedBy.appointmentId] || reassign.isPending.value"
                class="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-onprimary hover:bg-primaryh disabled:opacity-50"
                @click="move(r.occupiedBy.appointmentId)"
              >
                Mover
              </button>
            </template>
            <button
              class="rounded-md border border-border px-3 py-1.5 text-sm text-body hover:bg-surface2"
              @click="startEdit(r.id, r.name, r.category)"
            >
              Editar
            </button>
            <button
              :disabled="update.isPending.value"
              class="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface2 disabled:opacity-50"
              :class="r.active ? 'text-danger' : 'text-link'"
              @click="update.mutate({ id: r.id, active: !r.active })"
            >
              {{ r.active ? 'Desativar' : 'Reativar' }}
            </button>
          </div>
        </template>
      </li>
    </ul>
  </section>
</template>
