import { describe, expect, it } from 'vitest';
import { sortRooms } from '../../app/composables/useRooms';

const room = (name: string, active = true) => ({ name, active });

describe('sortRooms', () => {
  it('ordena pelo número, não como texto', () => {
    const names = sortRooms(['Sala 1', 'Sala 10', 'Sala 11', 'Sala 2', 'Sala 3'].map((n) => room(n))).map((r) => r.name);
    expect(names).toEqual(['Sala 1', 'Sala 2', 'Sala 3', 'Sala 10', 'Sala 11']);
  });

  it('mantém as desativadas no fim', () => {
    const names = sortRooms([room('Sala 1', false), room('Sala 10'), room('Sala 2')]).map((r) => r.name);
    expect(names).toEqual(['Sala 2', 'Sala 10', 'Sala 1']);
  });
});
