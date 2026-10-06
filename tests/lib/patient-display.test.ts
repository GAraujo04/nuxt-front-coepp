import { describe, expect, it } from 'vitest';
import { patientDisplayName } from '../../app/shared/lib/patient-display';

const patient = { code: 'PAC-00123', fullName: 'Nilda Araujo' };

describe('patientDisplayName', () => {
  it('administrativo vê o nome', () => {
    expect(patientDisplayName(patient, 'ADMIN')).toBe('Nilda Araujo');
  });

  it('estagiário vê o código nas listas (o nome fica no prontuário)', () => {
    expect(patientDisplayName(patient, 'INTERN')).toBe('PAC-00123');
  });

  it('supervisor vê só o código', () => {
    expect(patientDisplayName(patient, 'SUPERVISOR')).toBe('PAC-00123');
    // O backend nem envia o nome ao supervisor.
    expect(patientDisplayName({ code: 'PAC-00123', fullName: null }, 'SUPERVISOR')).toBe('PAC-00123');
  });

  it('sem papel conhecido, cai no lado seguro (código)', () => {
    expect(patientDisplayName(patient, undefined)).toBe('PAC-00123');
  });
});
