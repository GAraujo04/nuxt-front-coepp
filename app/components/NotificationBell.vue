<script setup lang="ts">
import { useMarkNotificationsSeen, useNotifications } from '../composables/useNotifications';
import type { AppNotification } from '../composables/useNotifications';
import { describeNotification } from '../shared/lib/notification-text';

// Sininho do cabeçalho: pendências (somem quando resolvidas) e
// informativos (contam até a lista ser aberta). Tudo calculado pelo
// backend a partir do estado do sistema — sem e-mail nem push.
const { user } = useAuth();
const notifications = useNotifications();
const markSeen = useMarkNotificationsSeen();
const open = ref(false);
const root = ref<HTMLElement | null>(null);

const unread = computed(() => notifications.data.value?.unread ?? 0);
const items = computed(() => notifications.data.value?.items ?? []);

function target(n: AppNotification) {
  const view = describeNotification(n);
  // O painel de pedidos de disponibilidade do admin fica na aba Usuários.
  if (n.kind === 'AVAILABILITY_REQUESTS' && user.value?.role === 'ADMIN') return { ...view, to: '/admin?tab=users' };
  return view;
}

function toggle() {
  open.value = !open.value;
  if (open.value && items.value.some((i) => i.unseen)) markSeen.mutate();
}
function go(to: string) {
  open.value = false;
  navigateTo(to);
}
function onDocClick(e: MouseEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) open.value = false;
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false;
}
onMounted(() => {
  document.addEventListener('click', onDocClick);
  document.addEventListener('keydown', onKeydown);
});
onUnmounted(() => {
  document.removeEventListener('click', onDocClick);
  document.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="relative rounded-md p-1.5 text-fsa-header-muted hover:text-fsa-header-link"
      :aria-label="unread > 0 ? `Avisos: ${unread} novo(s)` : 'Avisos'"
      :aria-expanded="open"
      @click="toggle"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
      </svg>
      <span
        v-if="unread > 0"
        class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white"
      >
        {{ unread > 99 ? '99+' : unread }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface shadow-lg"
      role="dialog"
      aria-label="Avisos"
    >
      <p class="border-b border-border px-4 py-2 text-sm font-semibold text-body">Avisos</p>
      <p v-if="notifications.isError.value" class="px-4 py-3 text-sm text-danger">Não foi possível carregar os avisos.</p>
      <p v-else-if="items.length === 0" class="px-4 py-6 text-center text-sm text-muted">Nada pendente por aqui.</p>
      <ul v-else class="max-h-96 overflow-y-auto">
        <li v-for="(n, i) in items" :key="`${n.kind}-${n.documentId ?? i}`" class="border-b border-border last:border-0">
          <button type="button" class="flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-surface2" @click="go(target(n).to)">
            <span
              class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              :class="n.actionable ? 'bg-amber-500' : n.unseen ? 'bg-blue-600' : 'bg-transparent'"
              aria-hidden="true"
            />
            <span class="text-body">
              {{ target(n).text }}
              <span v-if="n.actionable" class="block text-xs text-muted">Pendente</span>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
