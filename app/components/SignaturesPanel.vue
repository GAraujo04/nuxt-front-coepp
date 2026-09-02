<script setup lang="ts">
// Painel de assinaturas do documento (estagiário ao enviar, supervisor ao
// aprovar). Equivalente a shared/ui/SignaturesPanel.tsx.
interface Sig {
  signerName: string;
  signerRole: string;
  signerRef: string | null;
  provider: string;
  signedAt: string;
}
defineProps<{ signatures: Sig[] }>();

const ROLE_LABEL: Record<string, string> = { INTERN: 'Estagiário(a)', SUPERVISOR: 'Supervisor(a)' };

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
</script>

<template>
  <div v-if="signatures.length" class="rounded-lg border border-border bg-surface p-5 shadow-sm">
    <h3 class="mb-3 text-sm font-semibold text-body">Assinaturas</h3>
    <ul class="space-y-2">
      <li
        v-for="(s, i) in signatures"
        :key="i"
        class="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 text-sm last:border-0 last:pb-0"
      >
        <span class="text-body">
          <span class="text-ok">✔</span> {{ s.signerName }}
          <span v-if="s.signerRef" class="text-muted"> · {{ s.signerRef }}</span>
          <span class="text-muted"> · {{ ROLE_LABEL[s.signerRole] ?? s.signerRole }}</span>
        </span>
        <span class="text-xs text-muted">
          {{ formatDateTime(s.signedAt) }} · {{ s.provider === 'govbr' ? 'gov.br' : 'assinatura interna' }}
        </span>
      </li>
    </ul>
  </div>
</template>
