/** Papéis de usuário (RBAC) — espelha o enum UserRole do backend. */
export type Role = 'PATIENT' | 'INTERN' | 'SUPERVISOR' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  /** Só populado pra INTERN (login via TOTVS) — falta completar disciplina/supervisor/disponibilidade/termo? */
  profileComplete?: boolean;
}
