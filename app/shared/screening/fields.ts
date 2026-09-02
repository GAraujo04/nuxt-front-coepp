import type { ScreeningType } from '../../composables/useScreenings';

// Porta features/screening/model/screening-fields.ts — lógica pura (sem
// nenhuma dependência de React nem de Vue), por isso fica em shared/ (como
// masks.ts) e não em composables/: não usa nenhuma API de framework.
export interface FieldDef {
  path: string; // caminho no content (ex.: "identificacao.nome")
  label: string;
  hint?: string;
  kind: 'text' | 'textarea' | 'date' | 'currency' | 'select' | 'phone';
  options?: string[]; // para kind 'select'
}

export const SEXO = ['Masculino', 'Feminino'];
export const ESCOLARIDADE = [
  'Analfabeto',
  'Ensino Fundamental Incompleto',
  'Ensino Fundamental Completo',
  'Ensino Médio Incompleto',
  'Ensino Médio Completo',
  'Ensino Técnico Incompleto',
  'Ensino Técnico Completo',
  'Ensino Superior Incompleto',
  'Ensino Superior Completo',
  'Pós-Graduação',
];
export const ESTADO_CIVIL = ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'Separado(a) Judicialmente'];

export interface StepDef {
  id: string;
  label: string;
  fields: FieldDef[];
}

const analiseStep: StepDef = {
  id: 'analise',
  label: 'Análise',
  fields: [
    { path: 'analiseEncaminhamentos.entrevistasRealizadas', label: 'Entrevistas realizadas', kind: 'textarea', hint: 'Data, com quem, descrição da sessão.' },
    { path: 'analiseEncaminhamentos.analiseObservacoes', label: 'Análise e observações', kind: 'textarea', hint: 'Fundamentação teórico-técnica do encaminhamento.' },
    { path: 'analiseEncaminhamentos.referencias', label: 'Referências (ABNT)', kind: 'textarea', hint: 'Ao menos duas referências que embasam a análise.' },
    { path: 'analiseEncaminhamentos.entrevistaDevolutiva', label: 'Dados da entrevista devolutiva', kind: 'textarea' },
    { path: 'analiseEncaminhamentos.orientacoesEncaminhamentos', label: 'Orientações e encaminhamentos', kind: 'textarea' },
    { path: 'datas.inicioTriagem', label: 'Data inicial da triagem', kind: 'date' },
    { path: 'datas.entrevistaDevolutiva', label: 'Data da entrevista devolutiva', kind: 'date' },
  ],
};

const ADULT_STEPS: StepDef[] = [
  {
    id: 'identificacao',
    label: 'Identificação',
    fields: [
      { path: 'identificacao.nome', label: 'Nome / Nome Social', kind: 'text' },
      { path: 'identificacao.dataNascimento', label: 'Data de nascimento', kind: 'date' },
      { path: 'identificacao.sexo', label: 'Sexo', kind: 'select', options: SEXO },
      { path: 'identificacao.telefone', label: 'Telefone', kind: 'phone' },
      { path: 'identificacao.religiao', label: 'Religião', kind: 'text' },
      { path: 'identificacao.rendaFamiliar', label: 'Renda familiar aproximada', kind: 'currency' },
      { path: 'identificacao.escolaridade', label: 'Escolaridade', kind: 'select', options: ESCOLARIDADE },
      { path: 'identificacao.ocupacao', label: 'Ocupação / Profissão', kind: 'text' },
      { path: 'identificacao.estadoCivil', label: 'Estado civil / relacionamento', kind: 'select', options: ESTADO_CIVIL },
    ],
  },
  {
    id: 'familia',
    label: 'Família',
    fields: [
      { path: 'dadosFamiliares.comQuemReside', label: 'Com quem reside?', kind: 'textarea', hint: 'Composição familiar (sugestão: genograma).' },
    ],
  },
  { id: 'queixa', label: 'Queixa', fields: [{ path: 'motivoQueixa', label: 'Motivo / Queixa', kind: 'textarea', hint: 'Evolução da queixa, efeitos na vida diária, tratamentos prévios.' }] },
  {
    id: 'anamnese',
    label: 'Anamnese',
    fields: [
      { path: 'anamnese.vidaInfantil', label: '1. História da vida infantil', kind: 'textarea', hint: 'Gestação, desenvolvimento, relações sociais, percurso escolar, perdas e lutos.' },
      { path: 'anamnese.vidaAdolescente', label: '2. História da vida adolescente', kind: 'textarea', hint: 'Relações, sexualidade, escolha profissional, escola e trabalho.' },
      { path: 'anamnese.vidaAdulta', label: '3. História da vida adulta', kind: 'textarea', hint: 'Trabalho, relações afetivas e familiares, lazer, metas.' },
      { path: 'anamnese.vidaAtualIdoso', label: '4. História atual (se idoso/a)', kind: 'textarea' },
      { path: 'anamnese.antecedentesFamiliares', label: '5. Antecedentes familiares (sobre a queixa)', kind: 'textarea' },
    ],
  },
  analiseStep,
];

const CHILD_STEPS: StepDef[] = [
  {
    id: 'identificacao',
    label: 'Identificação',
    fields: [
      { path: 'identificacao.nome', label: 'Nome', kind: 'text' },
      { path: 'identificacao.dataNascimento', label: 'Data de nascimento', kind: 'date' },
      { path: 'identificacao.sexo', label: 'Sexo', kind: 'select', options: SEXO },
      { path: 'identificacao.telefone', label: 'Telefone', kind: 'phone' },
      { path: 'identificacao.escolaridade', label: 'Escolaridade', kind: 'select', options: ESCOLARIDADE },
      { path: 'identificacao.escolaSerie', label: 'Escola / Série escolar', kind: 'text' },
      { path: 'identificacao.religiao', label: 'Religião', kind: 'text' },
      { path: 'identificacao.rendaFamiliarSM', label: 'Renda familiar (salários-mínimos)', kind: 'text' },
    ],
  },
  {
    id: 'familia',
    label: 'Família',
    fields: [
      { path: 'dadosFamiliares.mae.nome', label: 'Mãe — nome', kind: 'text' },
      { path: 'dadosFamiliares.mae.idade', label: 'Mãe — idade', kind: 'text' },
      { path: 'dadosFamiliares.mae.escolaridade', label: 'Mãe — escolaridade', kind: 'select', options: ESCOLARIDADE },
      { path: 'dadosFamiliares.mae.profissao', label: 'Mãe — profissão', kind: 'text' },
      { path: 'dadosFamiliares.pai.nome', label: 'Pai — nome', kind: 'text' },
      { path: 'dadosFamiliares.pai.idade', label: 'Pai — idade', kind: 'text' },
      { path: 'dadosFamiliares.pai.escolaridade', label: 'Pai — escolaridade', kind: 'select', options: ESCOLARIDADE },
      { path: 'dadosFamiliares.pai.profissao', label: 'Pai — profissão', kind: 'text' },
      { path: 'dadosFamiliares.entrevistado', label: 'Entrevistado (relação com o atendido)', kind: 'text' },
      { path: 'dadosFamiliares.comQuemReside', label: 'Com quem reside?', kind: 'textarea', hint: 'Composição familiar (sugestão: genograma).' },
    ],
  },
  { id: 'queixa', label: 'Queixa', fields: [{ path: 'motivoQueixa', label: 'Motivo / Queixa', kind: 'textarea', hint: 'Queixa principal, evolução, percepção da criança e da família, tratamentos.' }] },
  {
    id: 'anamnese',
    label: 'Anamnese',
    fields: [
      { path: 'anamnese.concepcaoGestacao', label: '1. Concepção e gestação', kind: 'textarea' },
      { path: 'anamnese.nascimento', label: '2. Nascimento', kind: 'textarea' },
      { path: 'anamnese.alimentacao', label: '3. Alimentação', kind: 'textarea' },
      { path: 'anamnese.linguagem', label: '4. Linguagem', kind: 'textarea' },
      { path: 'anamnese.sono', label: '5. Sono', kind: 'textarea' },
      { path: 'anamnese.desenvolvimentoPsicomotor', label: '6. Desenvolvimento psicomotor', kind: 'textarea' },
      { path: 'anamnese.escolaridade', label: '7. Escolaridade', kind: 'textarea' },
      { path: 'anamnese.doencas', label: '8. Doenças', kind: 'textarea' },
      { path: 'anamnese.maniasTiques', label: '9. Manias, tiques ou hábitos', kind: 'textarea' },
      { path: 'anamnese.sexualidade', label: '10. Sexualidade', kind: 'textarea' },
      { path: 'anamnese.sociabilidadeBrinquedo', label: '11. Sociabilidade e brinquedo', kind: 'textarea' },
      { path: 'anamnese.vidaFamiliar', label: '12. Vida familiar', kind: 'textarea' },
    ],
  },
  analiseStep,
];

export function stepsFor(type: ScreeningType): StepDef[] {
  return type === 'SCREENING_ADULT' ? ADULT_STEPS : CHILD_STEPS;
}

/** Lê/escreve valores aninhados no content por caminho pontuado (ex.: "mae.nome"). */
export function getAt(obj: Record<string, unknown>, path: string): string {
  const val = path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], obj);
  return typeof val === 'string' ? val : '';
}

/** Lista os campos ainda não preenchidos (por etapa) — usado para exigir triagem completa. */
export function missingFields(type: ScreeningType, content: Record<string, unknown>): { step: string; label: string }[] {
  const out: { step: string; label: string }[] = [];
  for (const step of stepsFor(type)) {
    for (const f of step.fields) {
      if (!getAt(content, f.path).trim()) out.push({ step: step.label, label: f.label });
    }
  }
  return out;
}

export function setAt(obj: Record<string, unknown>, path: string, value: string): Record<string, unknown> {
  const keys = path.split('.');
  const clone = structuredClone(obj);
  let cur = clone as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!; // i < keys.length garante que sempre existe
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]!] = value; // path nunca é string vazia — sempre há um último segmento
  return clone;
}
