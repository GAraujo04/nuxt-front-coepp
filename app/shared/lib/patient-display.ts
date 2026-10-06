import type { Role } from '../auth/types';

/**
 * Como identificar um paciente na tela, conforme quem está olhando.
 *
 * O estagiário vê só o código de cadastro (LGPD — minimização: ele
 * identifica o paciente pelo código no prontuário e nos documentos, e o
 * nome não precisa ficar exposto em listas e cabeçalhos). Supervisor e
 * administrativo continuam vendo o nome.
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
const SEES_PATIENT_NAME: readonly Role[] = ['SUPERVISOR', 'ADMIN'];

export function patientDisplayName(patient: { code: string; fullName: string }, role: Role | undefined): string {
  return role && SEES_PATIENT_NAME.includes(role) ? patient.fullName : patient.code;
}
