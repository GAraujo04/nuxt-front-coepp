/**
 * i18n — pt-BR é o único locale, sem fallback pra en-US (não existe fallback
 * no i18next original — mantido igual aqui). Toda string de interface passa
 * por aqui; nada de texto hardcoded.
 */
export default {
  app: { name: 'PEP — Clínica-Escola de Psicologia' },
  auth: {
    login: 'Entrar',
    email: 'E-mail',
    password: 'Senha',
    signIn: 'Acessar o sistema',
    invalidCredentials: 'E-mail ou senha inválidos.',
    tooManyAttempts: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  },
  nav: {
    dashboard: 'Painel',
    agenda: 'Agenda',
    records: 'Prontuários',
    supervision: 'Supervisão',
    reviewQueue: 'Fila de Revisão',
    availability: 'Minha Disponibilidade',
    logout: 'Sair',
  },
  portal: {
    logoAlt: 'Logotipo da FSA',
    title: 'Portal de Acesso',
    subtitle: 'Selecione seu perfil para continuar.',
    accessButton: 'Acessar',
    // i18next usa {{var}}; vue-i18n usa {var} — única mudança de sintaxe ao portar.
    accessAriaLabel: 'Acessar {portal}',
    cards: {
      intern: {
        title: 'Portal do Aluno / Estagiário',
        description: 'Entrada com usuário e senha institucionais (TOTVS RM).',
      },
      patient: {
        title: 'Portal do Paciente',
        description: 'Entrada com CPF e data de nascimento.',
      },
      supervisor: {
        title: 'Portal do Coordenador',
        description: 'Entrada com e-mail e senha.',
      },
      admin: {
        title: 'Portal do Administrativo',
        description: 'Entrada com e-mail e senha.',
      },
    },
  },
  errors: {
    forbidden: 'Você não tem permissão para acessar esta página.',
    notFound: 'Página não encontrada.',
  },
};
