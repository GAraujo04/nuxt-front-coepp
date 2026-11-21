import { describe, expect, it } from 'vitest';
import { formatWindow } from '../../app/shared/lib/weekdays';

describe('formatWindow', () => {
  it('mostra dia e faixa de horário', () => {
    expect(formatWindow({ weekday: 1, startTime: '14:00', endTime: '18:00' })).toBe('Segunda · 14:00–18:00');
    expect(formatWindow({ weekday: 0, startTime: '08:00', endTime: '10:00' })).toBe('Domingo · 08:00–10:00');
  });
});
