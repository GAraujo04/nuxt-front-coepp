/**
 * Preenche os marcadores do termo de responsabilidade no momento do aceite.
 * Os marcadores vêm do arquivo versionado no backend
 * (docs/legal/termo-responsabilidade-estagiario.md):
 *   {{nome}} — nome completo do estagiário, do cadastro;
 *   {{data}} — data do aceite por extenso (ex.: 14 de outubro de 2026).
 *
 * Sem nome ainda (o aluno não digitou), a linha em branco do termo em papel
 * continua aparecendo, em vez de "Eu, , aluna…".
 */
export const BLANK_NAME = '_____________________________';

export function formatTermDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function fillTerm(content: string, values: { name?: string | null; date: Date }): string {
  const name = (values.name ?? '').trim().replace(/\s+/g, ' ');
  return content.replaceAll('{{nome}}', name || BLANK_NAME).replaceAll('{{data}}', formatTermDate(values.date));
}
