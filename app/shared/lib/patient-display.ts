import type { Role } from '../auth/types';

/**
 * Como identificar um paciente na tela, conforme quem está olhando.
 *
 * LGPD — minimização:
 * - Administrativo vê o nome.
 * - Estagiário vê o código nas listas; o nome aparece só ao abrir o
 *   prontuário do paciente (ele atende, precisa saber com quem fala).
 * - Supervisor vê só o código — o nome ele lê na ficha de triagem. O
 *   backend nem envia o nome a ele (shared/privacy/patient_name.py).
 *
 * A regra fica aqui, e não espalhada pelos templates, para que um
 * componente reaproveitado entre papéis não vaze o nome por esquecimento.
 *
 * Lista de quem VÊ o nome, e não de quem não vê: um papel novo, ou a
 * sessão ainda sem papel, cai no lado seguro (código).
 *
 * Não cobre o CONTEÚDO dos documentos: o laudo e o relatório psicológico
 * carregam o nome do paciente porque o CFP exige — isso é o documento, não
 * a navegação.
 */
const SEES_PATIENT_NAME_IN_LISTS: readonly Role[] = ['ADMIN'];

export function patientDisplayName(patient: { code: string; fullName: string | null }, role: Role | undefined): string {
  return role && SEES_PATIENT_NAME_IN_LISTS.includes(role) && patient.fullName ? patient.fullName : patient.code;
}
