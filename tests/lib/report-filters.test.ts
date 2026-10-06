import { describe, expect, it } from 'vitest';
import { applyReportFilters, EMPTY_REPORT_FILTERS } from '../../app/shared/lib/report-filters';

// Datas ao meio-dia UTC: o "dia local" é o mesmo em qualquer fuso do Brasil.
const items = [
  { id: 'c', authorId: 'ana', type: 'EVOLUTION', status: 'APROVADO_LOCKED', patientCode: '20260003', submittedAt: '2026-10-03T12:00:00Z' },
  { id: 'a', authorId: 'ana', type: 'SCREENING_ADULT', status: 'ENVIADO_PARA_SUPERVISAO', patientCode: '20260001', submittedAt: '2026-10-01T12:00:00Z' },
  { id: 'b', authorId: 'bia', type: 'EVOLUTION', status: 'EM_REVISAO', patientCode: '20260002', submittedAt: '2026-10-02T12:00:00Z' },
];
const ids = (xs: { id: string }[]) => xs.map((x) => x.id);

describe('applyReportFilters', () => {
  it('padrão: todos, em ordem de chegada', () => {
    expect(ids(applyReportFilters(items, EMPTY_REPORT_FILTERS))).toEqual(['a', 'b', 'c']);
  });

  it('mais recentes primeiro', () => {
    expect(ids(applyReportFilters(items, { ...EMPTY_REPORT_FILTERS, order: 'recent' }))).toEqual(['c', 'b', 'a']);
  });

  it('combina aluno e tipo', () => {
    expect(ids(applyReportFilters(items, { ...EMPTY_REPORT_FILTERS, authorId: 'ana', type: 'EVOLUTION' }))).toEqual(['c']);
  });

  it('período inclusivo nas duas pontas', () => {
    expect(ids(applyReportFilters(items, { ...EMPTY_REPORT_FILTERS, from: '2026-10-02', to: '2026-10-03' }))).toEqual(['b', 'c']);
    expect(ids(applyReportFilters(items, { ...EMPTY_REPORT_FILTERS, to: '2026-10-01' }))).toEqual(['a']);
  });

  it('status e trecho do código do paciente', () => {
    expect(ids(applyReportFilters(items, { ...EMPTY_REPORT_FILTERS, status: 'EM_REVISAO' }))).toEqual(['b']);
    expect(ids(applyReportFilters(items, { ...EMPTY_REPORT_FILTERS, patientCode: '0001' }))).toEqual(['a']);
  });

  it('não altera a lista recebida', () => {
    const copy = [...items];
    applyReportFilters(items, { ...EMPTY_REPORT_FILTERS, order: 'recent' });
    expect(items).toEqual(copy);
  });
});
