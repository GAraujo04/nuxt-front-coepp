import { DOC_TYPE_LABEL } from '../screening/fields';

/**
 * Texto e destino de cada aviso. O backend manda só o fato (tipo,
 * quantidade, documento); a redação fica aqui, junto dos rótulos que a
 * tela já usa. Função pura, para os textos serem testáveis.
 */
interface NotificationLike {
  kind: string;
  count: number;
  documentId: string | null;
  docType: string | null;
  patientCode: string | null;
  until: string | null;
}

export interface NotificationView {
  text: string;
  to: string;
}

function plural(n: number, one: string, many: string) {
  return n === 1 ? one : many;
}

function docLabel(n: NotificationLike) {
  const type = n.docType ? (DOC_TYPE_LABEL[n.docType as keyof typeof DOC_TYPE_LABEL] ?? n.docType) : 'Documento';
  return n.patientCode ? `${type} (Nº ${n.patientCode})` : type;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function describeNotification(n: NotificationLike): NotificationView {
  switch (n.kind) {
    case 'REVIEW_QUEUE':
      return {
        text: `${n.count} ${plural(n.count, 'documento aguardando', 'documentos aguardando')} sua revisão`,
        to: '/revisao',
      };
    case 'AVAILABILITY_REQUESTS':
      return {
        text: `${n.count} ${plural(n.count, 'pedido', 'pedidos')} de alteração de disponibilidade`,
        to: '/supervisao',
      };
    case 'AVAILABILITY_CHANGED':
      return {
        text: `${n.count} ${plural(n.count, 'estagiário alterou', 'estagiários alteraram')} a disponibilidade`,
        to: '/admin?tab=users',
      };
    case 'PENDING_MATCHES':
      return {
        text: `${n.count} ${plural(n.count, 'paciente', 'pacientes')} sem pareamento — ajuste manual`,
        to: '/admin?tab=matching',
      };
    case 'ASSIGNMENTS_WITHOUT_SUPERVISOR':
      return {
        text: `${n.count} ${plural(n.count, 'vínculo', 'vínculos')} sem supervisor — os documentos não chegam a nenhuma fila`,
        to: '/admin?tab=assignments',
      };
    case 'CHANGES_REQUESTED':
      return { text: `Ajustes solicitados em ${docLabel(n)}`, to: `/triagem/${n.documentId}` };
    case 'AVAILABILITY_UNLOCKED':
      return {
        text: n.until
          ? `Alteração de disponibilidade liberada até ${formatDateTime(n.until)}`
          : 'Alteração de disponibilidade liberada',
        to: '/estagiario/disponibilidade',
      };
    case 'DOCUMENT_APPROVED':
      return { text: `${docLabel(n)} aprovado`, to: `/triagem/${n.documentId}` };
    case 'DOCUMENT_REJECTED':
      return { text: `${docLabel(n)} rejeitado`, to: `/triagem/${n.documentId}` };
    default:
      return { text: 'Novo aviso', to: '/' };
  }
}
