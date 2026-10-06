/**
 * Filtros dos relatórios do supervisor. Função pura (sem Vue), para o
 * critério ficar testável e igual onde quer que a lista seja exibida.
 *
 * Datas do período são dias do calendário LOCAL ("yyyy-mm-dd", do
 * <input type="date">), inclusivos nas duas pontas: "até 10/10" inclui
 * um documento enviado às 23h do dia 10.
 */
export interface ReportFilters {
  authorId: string;
  type: string;
  status: string;
  from: string;
  to: string;
  patientCode: string;
  order: 'arrival' | 'recent';
}

export const EMPTY_REPORT_FILTERS: ReportFilters = {
  authorId: '',
  type: '',
  status: '',
  from: '',
  to: '',
  patientCode: '',
  order: 'arrival',
};

interface Filterable {
  authorId: string;
  type: string;
  status: string;
  patientCode: string;
  submittedAt: string;
}

function localDay(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function applyReportFilters<T extends Filterable>(items: readonly T[], f: ReportFilters): T[] {
  const code = f.patientCode.trim().toLowerCase();
  const out = items.filter((i) => {
    if (f.authorId && i.authorId !== f.authorId) return false;
    if (f.type && i.type !== f.type) return false;
    if (f.status && i.status !== f.status) return false;
    if (code && !i.patientCode.toLowerCase().includes(code)) return false;
    const day = localDay(i.submittedAt);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    return true;
  });
  // Ordem de chegada = mais antigo primeiro (quem espera há mais tempo).
  out.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  return f.order === 'recent' ? out.reverse() : out;
}
