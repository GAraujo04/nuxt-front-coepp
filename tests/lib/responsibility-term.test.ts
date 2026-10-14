import { describe, expect, it } from 'vitest';
import { BLANK_NAME, fillTerm, formatTermDate } from '../../app/shared/lib/responsibility-term';

const TERM = 'Eu, {{nome}}, aluna (o) regularmente matriculado/a…\n\nSanto André, {{data}}.';
const DATE = new Date(2026, 9, 14); // 14/10/2026, hora local

describe('fillTerm', () => {
  it('preenche nome e data por extenso', () => {
    expect(fillTerm(TERM, { name: 'Maria  da Silva ', date: DATE })).toBe(
      'Eu, Maria da Silva, aluna (o) regularmente matriculado/a…\n\nSanto André, 14 de outubro de 2026.',
    );
  });

  it('sem nome, mantém a linha em branco do termo em papel', () => {
    expect(fillTerm(TERM, { name: '', date: DATE })).toContain(`Eu, ${BLANK_NAME}, aluna`);
    expect(fillTerm(TERM, { name: null, date: DATE })).toContain(`Eu, ${BLANK_NAME}, aluna`);
  });

  it('data por extenso em português', () => {
    expect(formatTermDate(new Date(2026, 0, 5))).toBe('5 de janeiro de 2026');
  });

  it('texto sem marcadores passa intacto (termo antigo)', () => {
    expect(fillTerm('Texto fixo.', { name: 'Ana', date: DATE })).toBe('Texto fixo.');
  });
});
