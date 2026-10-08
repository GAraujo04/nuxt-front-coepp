import { describe, expect, it } from 'vitest';
import { describeNotification } from '../../app/shared/lib/notification-text';

const base = { count: 1, documentId: null, docType: null, patientCode: null, until: null };

describe('describeNotification', () => {
  it('pluraliza a fila de revisão e leva à fila', () => {
    expect(describeNotification({ ...base, kind: 'REVIEW_QUEUE', count: 1 })).toEqual({
      text: '1 documento aguardando sua revisão',
      to: '/revisao',
    });
    expect(describeNotification({ ...base, kind: 'REVIEW_QUEUE', count: 3 }).text).toBe(
      '3 documentos aguardando sua revisão',
    );
  });

  it('documento do estagiário: tipo, código e link para o documento', () => {
    expect(
      describeNotification({ ...base, kind: 'CHANGES_REQUESTED', documentId: 'd1', docType: 'EVOLUTION', patientCode: '20260003' }),
    ).toEqual({ text: 'Ajustes solicitados em Ficha de Evolução (Nº 20260003)', to: '/triagem/d1' });
  });

  it('avisos do admin abrem a aba certa', () => {
    expect(describeNotification({ ...base, kind: 'ASSIGNMENTS_WITHOUT_SUPERVISOR', count: 2 }).to).toBe(
      '/admin?tab=assignments',
    );
  });

  it('tipo desconhecido não quebra a tela', () => {
    expect(describeNotification({ ...base, kind: 'NOVO_TIPO_FUTURO' }).text).toBe('Novo aviso');
  });
});
