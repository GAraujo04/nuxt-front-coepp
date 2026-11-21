import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { api } from '../shared/api/client';

/** Espelha RoomCategory do backend (shared/scheduling/room_category.py). */
export type RoomCategory = 'PADRAO' | 'ACESSIVEL' | 'INFANTIL' | 'GRUPO';

export const ROOM_CATEGORY_LABEL: Record<RoomCategory, string> = {
  PADRAO: 'Padrão',
  ACESSIVEL: 'Adaptada (PCD)',
  INFANTIL: 'Atendimento infantil',
  GRUPO: 'Grupo / família',
};
export const ROOM_CATEGORIES = Object.keys(ROOM_CATEGORY_LABEL) as RoomCategory[];

export interface RoomStatus {
  id: string;
  name: string;
  category: RoomCategory;
  active: boolean;
  occupiedBy: {
    appointmentId: string;
    scheduledAt: string;
    patientName: string;
    internName: string;
  } | null;
}

/**
 * Lista as salas com status (ocupada/disponível) — Administrativo.
 * Por padrão só as ativas (status e realocação); a gestão de salas pede
 * também as desativadas.
 */
export function useRooms(opts: { includeInactive?: boolean } = {}) {
  const includeInactive = !!opts.includeInactive;
  return useQuery({
    queryKey: ['rooms', { includeInactive }],
    queryFn: async () =>
      sortRooms((await api.get<RoomStatus[]>('/rooms', { params: { includeInactive } })).data),
  });
}

// Ordem natural ("Sala 2" antes de "Sala 10"): o banco ordena o nome como
// texto. Ativas primeiro, como o backend já devolve.
const byName = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
export function sortRooms<T extends { name: string; active: boolean }>(rooms: T[]): T[] {
  return [...rooms].sort((a, b) => Number(b.active) - Number(a.active) || byName.compare(a.name, b.name));
}

/** Cadastra uma sala nova. */
export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; category: RoomCategory }) => (await api.post('/rooms', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

/** Edita nome/categoria ou ativa/desativa uma sala. */
export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...changes }: { id: string; name?: string; category?: RoomCategory; active?: boolean }) =>
      api.patch(`/rooms/${id}`, changes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

/** Realoca manualmente a sala de um agendamento, validando conflito no backend. */
export function useReassignRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appointmentId, roomId }: { appointmentId: string; roomId: string }) =>
      api.patch('/rooms/reassign', { appointmentId, roomId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}
