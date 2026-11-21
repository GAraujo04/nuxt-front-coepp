/** 0=domingo .. 6=sábado — mesma convenção do backend (weekday do JS). */
export const WEEKDAY_LABEL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** "Segunda · 14:00–18:00" — uma janela de disponibilidade recorrente. */
export function formatWindow(w: { weekday: number; startTime: string; endTime: string }) {
  return `${WEEKDAY_LABEL[w.weekday] ?? '?'} · ${w.startTime}–${w.endTime}`;
}
