import type { ScreeningType } from '../../composables/useScreenings';

// Porta features/screening/model/screening-fields.ts — lógica pura (sem
// nenhuma dependência de React nem de Vue), por isso fica em shared/ (como
// masks.ts) e não em composables/: não usa nenhuma API de framework.
export interface FieldDef {
  path: string; // caminho no content (ex.: "identificacao.nome")
  label: string;
  hint?: string;
  // 'readonly' exibe sem deixar editar: é o campo cujo valor foi copiado do
  // cadastro do paciente quando o documento foi criado (ver initialContentFor).
  kind: 'text' | 'textarea' | 'date' | 'currency' | 'select' | 'phone' | 'readonly';
  options?: string[]; // para kind 'select'
}

/**
 * Grupo que se repete dentro de uma etapa — hoje só a Ficha de Evolução,
 * que acumula uma entrada por atendimento no MESMO documento (no papel, o
 * bloco Data/Síntese/Estagiário/Supervisor aparece repetido na folha).
 *
 * Os `path` dos campos são RELATIVOS ao item, não ao content: o caminho
 * absoluto de um campo é `${repeat.path}.${índice}.${field.path}`.
 */
export interface RepeatDef {
  path: string; // caminho da lista no content (ex.: "sessoes")
  itemLabel: string; // rótulo de cada item ("Atendimento 1", "Atendimento 2"…)
  addLabel: string;
  fields: FieldDef[];
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
  repeat?: RepeatDef;
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

// --- Documentos de estágio (extraídos dos .docx do COEPP, em docs/) -------

const EVOLUTION_STEPS: StepDef[] = [
  {
    id: 'atendimentos',
    label: 'Atendimentos',
    fields: [],
    repeat: {
      path: 'sessoes',
      itemLabel: 'Atendimento',
      addLabel: '+ Adicionar atendimento',
      fields: [
        { path: 'dataAtendimento', label: 'Data do atendimento', kind: 'date' },
        { path: 'sinteseAtendimento', label: 'Síntese do atendimento', kind: 'textarea' },
        { path: 'estagiarioResponsavel', label: 'Estagiário(a) que realizou o atendimento', kind: 'text' },
        { path: 'supervisorResponsavel', label: 'Supervisor(a) responsável', kind: 'text' },
      ],
    },
  },
];

// Laudo e Relatório Psicológico são o MESMO roteiro de seções (identificação a conclusão, mais
// referências e recibo de entrega) — os dois .docx divergem só no título e
// na observação de rodapé, que são texto da tela, não campo. Continuam
// tipos distintos porque são documentos distintos perante o CFP.
const CFP_STEPS: StepDef[] = [
  {
    id: 'identificacao',
    label: 'Identificação',
    fields: [
      { path: 'identificacao.nome', label: 'Nome do paciente', kind: 'readonly', hint: 'Copiado do cadastro do paciente.' },
      { path: 'identificacao.dataNascimento', label: 'Data de nascimento', kind: 'readonly', hint: 'Copiada do cadastro do paciente.' },
      { path: 'identificacao.solicitante', label: 'Solicitante', kind: 'text' },
      { path: 'identificacao.finalidade', label: 'Finalidade', kind: 'textarea' },
      { path: 'identificacao.autores', label: 'Autores', kind: 'text' },
    ],
  },
  { id: 'demanda', label: 'Demanda', fields: [{ path: 'descricaoDemanda', label: 'Descrição da demanda', kind: 'textarea' }] },
  { id: 'procedimentos', label: 'Procedimentos', fields: [{ path: 'procedimentos', label: 'Procedimentos', kind: 'textarea' }] },
  { id: 'analise', label: 'Análise', fields: [{ path: 'analise', label: 'Análise', kind: 'textarea' }] },
  { id: 'conclusao', label: 'Conclusão', fields: [{ path: 'conclusao', label: 'Conclusão', kind: 'textarea' }] },
  {
    id: 'encerramento',
    label: 'Encerramento',
    fields: [
      { path: 'localData', label: 'Local e data', kind: 'text', hint: 'Ex.: Santo André (SP), 16 de setembro de 2026.' },
      { path: 'referencias', label: 'Referências', kind: 'textarea', hint: 'Preferencialmente em nota de rodapé, conforme ABNT.' },
      { path: 'entrega.responsavelNome', label: 'Recibo — quem recebe a cópia', kind: 'text' },
      { path: 'entrega.responsavelPor', label: 'Recibo — responsável por', kind: 'text' },
      { path: 'entrega.dataRecebimento', label: 'Recibo — data de recebimento', kind: 'date' },
    ],
  },
];

const ACOMPANHAMENTO_SEMANAL_STEPS: StepDef[] = [
  {
    id: 'identificacao',
    label: 'Identificação',
    fields: [
      { path: 'identificacao.pacienteInstituicao', label: 'Paciente / Instituição', kind: 'readonly', hint: 'Copiado do cadastro do paciente.' },
      { path: 'identificacao.dataAtendimento', label: 'Data do atendimento / intervenção', kind: 'date' },
      { path: 'identificacao.objetivoAtendimento', label: 'Objetivo do atendimento / intervenção', kind: 'textarea' },
      { path: 'identificacao.numeroAtendimento', label: 'Atendimento / intervenção nº', kind: 'text' },
    ],
  },
  {
    id: 'relato',
    label: 'Relato',
    fields: [{ path: 'relatoAtendimento', label: 'Relato do atendimento / intervenção', kind: 'textarea', hint: 'Em formato de diálogo ou de descrição, a critério do supervisor docente.' }],
  },
  {
    id: 'analise',
    label: 'Análise',
    fields: [{ path: 'analise', label: 'Análise', kind: 'textarea', hint: 'Análise psicológica do atendimento e/ou do teste aplicado, fundamentada no arcabouço teórico da Psicologia.' }],
  },
  {
    id: 'referencias',
    label: 'Referências',
    fields: [{ path: 'referencias', label: 'Referências', kind: 'textarea', hint: 'Lista das referências utilizadas na análise.' }],
  },
];

// Parcial e Final compartilham as oito seções: o .docx é um só ("RELATÓRIO
// FINAL (OU PARCIAL)"). São dois tipos por decisão de produto, para
// aparecerem separados no prontuário.
const RELATORIO_ESTAGIO_STEPS: StepDef[] = [
  { id: 'introducao', label: 'Introdução', fields: [{ path: 'introducao', label: 'Introdução', kind: 'textarea', hint: 'Do que se trata, onde foi realizado, carga horária cumprida e fundamentação teórica.' }] },
  { id: 'instituicao', label: 'Instituição', fields: [{ path: 'caracterizacaoInstituicao', label: 'Caracterização da instituição / organização', kind: 'textarea', hint: 'Identificação, ramo de atuação, estrutura física, organograma, história, demanda e queixa inicial.' }] },
  { id: 'referencial', label: 'Referencial', fields: [{ path: 'referencialTeorico', label: 'Referencial teórico', kind: 'textarea', hint: 'De maneira sucinta, a partir de qual referencial base o trabalho em campo foi realizado.' }] },
  { id: 'procedimentos', label: 'Procedimentos', fields: [{ path: 'procedimentosTecnicas', label: 'Procedimentos e técnicas psicológicas utilizadas', kind: 'textarea', hint: 'Técnicas, materiais e instrumentos, número total de intervenções, duração dos atendimentos, ausências.' }] },
  { id: 'acompanhamentos', label: 'Acompanhamentos', fields: [{ path: 'relatoriosAcompanhamento', label: 'Relatórios de acompanhamento', kind: 'textarea', hint: 'Apresentação dos relatórios de acompanhamento semanal realizados no bimestre (anexo).' }] },
  { id: 'analise', label: 'Análise', fields: [{ path: 'analise', label: 'Análise', kind: 'textarea', hint: 'Síntese do acompanhamento, metas alcançadas e resultados, conforme o referencial declarado na introdução.' }] },
  { id: 'consideracoes', label: 'Considerações', fields: [{ path: 'consideracoesFinais', label: 'Considerações finais', kind: 'textarea', hint: 'Síntese dos resultados obtidos, orientações e encaminhamentos realizados.' }] },
  { id: 'referencias', label: 'Referências', fields: [{ path: 'referencias', label: 'Referências', kind: 'textarea', hint: 'Conforme ABNT.' }] },
];

/**
 * Roteiro de cada tipo de documento.
 *
 * `Record<ScreeningType, …>` de propósito: um tipo novo no union sem
 * roteiro aqui quebra a compilação, em vez de abrir um formulário vazio em
 * produção — foi o que o `stepsFor` com ternário permitia.
 */
const STEPS_BY_TYPE: Record<ScreeningType, StepDef[]> = {
  SCREENING_ADULT: ADULT_STEPS,
  SCREENING_CHILD: CHILD_STEPS,
  EVOLUTION: EVOLUTION_STEPS,
  PSYCH_ASSESSMENT: CFP_STEPS,
  PSYCH_REPORT: CFP_STEPS,
  WEEKLY_REPORT: ACOMPANHAMENTO_SEMANAL_STEPS,
  PARTIAL_REPORT: RELATORIO_ESTAGIO_STEPS,
  FINAL_REPORT: RELATORIO_ESTAGIO_STEPS,
};

export function stepsFor(type: ScreeningType): StepDef[] {
  return STEPS_BY_TYPE[type];
}

/** Lê/escreve valores aninhados no content por caminho pontuado (ex.: "mae.nome"). */
export function getAt(obj: Record<string, unknown>, path: string): string {
  const val = path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], obj);
  return typeof val === 'string' ? val : '';
}

/** Itens de um grupo repetível. Sempre devolve array — content novo não tem a chave ainda. */
export function getList(content: Record<string, unknown>, path: string): Record<string, unknown>[] {
  const val = path.split('.').reduce<unknown>((acc, k) => (acc as Record<string, unknown>)?.[k], content);
  return Array.isArray(val) ? (val as Record<string, unknown>[]) : [];
}

/** Acrescenta um item vazio ao grupo repetível, devolvendo um content novo. */
export function addItem(content: Record<string, unknown>, path: string): Record<string, unknown> {
  const clone = structuredClone(content);
  const keys = path.split('.');
  let cur = clone as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i]!;
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  const last = keys[keys.length - 1]!;
  const list = Array.isArray(cur[last]) ? (cur[last] as Record<string, unknown>[]) : [];
  cur[last] = [...list, {}];
  return clone;
}

/** Remove o item de índice `index` do grupo repetível, devolvendo um content novo. */
export function removeItem(content: Record<string, unknown>, path: string, index: number): Record<string, unknown> {
  const clone = structuredClone(content);
  const keys = path.split('.');
  let cur = clone as Record<string, unknown>;
  for (let i = 0; i < keys.length - 1; i++) {
    cur = (cur[keys[i]!] ?? {}) as Record<string, unknown>;
  }
  const last = keys[keys.length - 1]!;
  const list = Array.isArray(cur[last]) ? (cur[last] as Record<string, unknown>[]) : [];
  cur[last] = list.filter((_, i) => i !== index);
  return clone;
}

/** Caminho absoluto de um campo dentro de um item do grupo (ex.: "sessoes.0.dataAtendimento"). */
export function itemPath(repeat: RepeatDef, index: number, field: FieldDef): string {
  return `${repeat.path}.${index}.${field.path}`;
}

/** Lista os campos ainda não preenchidos (por etapa) — usado para exigir o documento completo. */
export function missingFields(type: ScreeningType, content: Record<string, unknown>): { step: string; label: string }[] {
  const out: { step: string; label: string }[] = [];
  for (const step of stepsFor(type)) {
    for (const f of step.fields) {
      if (!getAt(content, f.path).trim()) out.push({ step: step.label, label: f.label });
    }
    if (!step.repeat) continue;

    // Grupo repetível: um documento sem nenhum item está incompleto, e cada
    // item precisa estar inteiro. Sem o primeiro caso, uma Ficha de Evolução
    // vazia passaria como completa (o laço acima não tem o que percorrer).
    const items = getList(content, step.repeat.path);
    if (items.length === 0) {
      out.push({ step: step.label, label: `${step.repeat.itemLabel} (nenhum registrado)` });
      continue;
    }
    items.forEach((_, index) => {
      for (const f of step.repeat!.fields) {
        if (!getAt(content, itemPath(step.repeat!, index, f)).trim()) {
          out.push({ step: step.label, label: `${step.repeat!.itemLabel} ${index + 1} — ${f.label}` });
        }
      }
    });
  }
  return out;
}

/** Rótulo de exibição de cada tipo de documento. */
export const DOC_TYPE_LABEL: Record<ScreeningType, string> = {
  SCREENING_ADULT: 'Triagem — Adulto',
  SCREENING_CHILD: 'Triagem — Criança/Adolescente',
  EVOLUTION: 'Ficha de Evolução',
  PSYCH_ASSESSMENT: 'Laudo Psicológico',
  WEEKLY_REPORT: 'Relatório de Acompanhamento Semanal',
  PARTIAL_REPORT: 'Relatório Parcial de Estágio',
  FINAL_REPORT: 'Relatório Final de Estágio',
  PSYCH_REPORT: 'Relatório Psicológico',
};

/**
 * Uma das sete linhas fixas do prontuário.
 *
 * Todo paciente tem UM documento de cada — não é uma lista que cresce, é um
 * conjunto fechado que começa todo "Não iniciado" e vai sendo preenchido.
 * Por isso a tela lista os slots (sempre os sete) e não os documentos
 * existentes: um documento que ainda não foi criado precisa aparecer do
 * mesmo jeito, senão não há por onde começá-lo.
 *
 * `types` é uma lista porque a triagem é um slot só com duas variantes
 * excludentes: o paciente é adulto OU criança, nunca os dois. Slot com mais
 * de um tipo exige a escolha antes de criar; os de tipo único são criados
 * direto no clique.
 */
export interface DocSlot {
  id: string;
  label: string;
  types: ScreeningType[];
}

export const PATIENT_DOC_SLOTS: DocSlot[] = [
  { id: 'triagem', label: 'Triagem', types: ['SCREENING_ADULT', 'SCREENING_CHILD'] },
  { id: 'evolucao', label: DOC_TYPE_LABEL.EVOLUTION, types: ['EVOLUTION'] },
  { id: 'semanal', label: DOC_TYPE_LABEL.WEEKLY_REPORT, types: ['WEEKLY_REPORT'] },
  { id: 'laudo', label: DOC_TYPE_LABEL.PSYCH_ASSESSMENT, types: ['PSYCH_ASSESSMENT'] },
  { id: 'psicologico', label: DOC_TYPE_LABEL.PSYCH_REPORT, types: ['PSYCH_REPORT'] },
  { id: 'parcial', label: DOC_TYPE_LABEL.PARTIAL_REPORT, types: ['PARTIAL_REPORT'] },
  { id: 'final', label: DOC_TYPE_LABEL.FINAL_REPORT, types: ['FINAL_REPORT'] },
];

export interface PatientSnapshot {
  fullName: string;
  birthDate: string | null;
}

/**
 * Content inicial de um documento novo.
 *
 * Copia do cadastro os campos de identificação que a tela mostra como
 * `readonly`. É cópia, não leitura ao vivo: depois de APROVADO_LOCKED o
 * conteúdo é imutável (trigger WORM sobre content_hash), então um nome lido
 * do cadastro na hora de exibir mudaria um laudo já assinado se alguém
 * corrigisse o cadastro do paciente depois.
 *
 * Como são campos não editáveis, preenchê-los aqui é a ÚNICA chance — um
 * documento criado sem este content nasce com a identificação vazia e sem
 * como corrigir pela tela.
 */
export function initialContentFor(type: ScreeningType, patient: PatientSnapshot): Record<string, unknown> {
  switch (type) {
    case 'PSYCH_ASSESSMENT':
    case 'PSYCH_REPORT':
      return { identificacao: { nome: patient.fullName, dataNascimento: patient.birthDate ?? '' } };
    case 'WEEKLY_REPORT':
      return { identificacao: { pacienteInstituicao: patient.fullName } };
    case 'EVOLUTION':
      return { sessoes: [{}] }; // já abre com o primeiro atendimento em branco
    default:
      return {};
  }
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
