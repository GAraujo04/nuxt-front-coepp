import { describe, expect, it } from 'vitest';
import { patientDisplayName } from '../../app/shared/lib/patient-display';

const patient = { code: 'PAC-00123', fullName: 'Nilda Araujo' };

describe('patientDisplayName', () => {
  it('estagiário vê só o código', () => {
    expect(patientDisplayName(patient, 'INTERN')).toBe('PAC-00123');
  });

  it('supervisor e administrativo continuam vendo o nome', () => {
    expect(patientDisplayName(patient, 'SUPERVISOR')).toBe('Nilda Araujo');
    expect(patientDisplayName(patient, 'ADMIN')).toBe('Nilda Araujo');
  });

  it('sem papel conhecido, cai no lado seguro (código)', () => {
    expect(patientDisplayName(patient, undefined)).toBe('PAC-00123');
  });
});
