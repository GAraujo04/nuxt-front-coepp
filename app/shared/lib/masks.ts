/** Máscaras e validadores de formato (pt-BR). Formatam enquanto o usuário digita. */

export function maskCPF(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return d;
}

/** Telefone com DDD. `mobile` decide 9 dígitos (móvel) ou 8 (fixo). */
export function maskPhone(v: string, mobile: boolean): string {
  const d = v.replace(/\D/g, '').slice(0, mobile ? 11 : 10);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  const split = mobile ? 5 : 4;
  if (rest.length <= split) return `(${ddd}) ${rest}`;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

export function maskRA(v: string): string {
  return v.replace(/\D/g, '').slice(0, 6);
}

/** Usuário RM (TOTVS): só dígitos, 11 caracteres. */
export function maskUsuarioRm(v: string): string {
  return v.replace(/\D/g, '').slice(0, 11);
}

/** CRP no formato NN/NNNNNN (ex.: 06/123456). */
export function maskCRP(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
}

/** Valor monetário em R$ (ex.: "R$ 1.234,56"). */
export function maskCurrency(v: string): string {
  const d = v.replace(/\D/g, '');
  if (!d) return '';
  return (parseInt(d, 10) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Comprimento do texto JÁ MASCARADO — vira o `maxlength` do input.
 *
 * Não é a contagem de dígitos: inclui os separadores que a máscara insere
 * (`000.000.000-00` tem 11 dígitos e 14 caracteres). O telefone depende do
 * tipo, porque o fixo tem um dígito menos que o móvel.
 */
export const MASK_LENGTH = {
  cpf: 14, // 000.000.000-00
  ra: 6, // 123456
  usuarioRm: 11, // 11 dígitos, sem separador
  crp: 9, // 06/123456
} as const;

export function phoneMaskLength(mobile: boolean): number {
  return mobile ? 15 : 14; // (11) 91234-5678 / (11) 1234-5678
}

/**
 * Aplica `mask` ao que está no input e devolve o resultado, mantendo o DOM
 * em sincronia com ele.
 *
 * A reescrita de `el.value` é o ponto do helper. Sem ela, digitar além do
 * limite da máscara deixava o caractere excedente VISÍVEL no campo: a
 * máscara descarta o excesso e devolve a mesma string que o model já
 * tinha, o model não muda, e sem mudança de model o Vue não repinta um
 * input ligado por `:value` — o DOM ficava adiante do estado. O valor
 * enviado ao backend estava certo desde sempre; o que enganava era o campo
 * parecer aceitar mais dígitos do que aceita.
 *
 * A atribuição não mexe no cursor no caso normal: o browser ignora
 * `value = value` quando o texto é idêntico, então o cursor só volta ao
 * fim exatamente quando a máscara corrigiu algo.
 */
export function applyMask(event: Event, mask: (raw: string) => string): string {
  const el = event.target as HTMLInputElement;
  const masked = mask(el.value);
  el.value = masked;
  return masked;
}

/**
 * Hoje em `yyyy-mm-dd`, para o `max` dos campos de data de nascimento.
 *
 * Montado a partir dos getters LOCAIS em vez de `toISOString()`, que
 * formata em UTC: depois das 21h em São Paulo (UTC−3) o UTC já virou o dia
 * seguinte, e o `max` liberaria uma data de nascimento no futuro.
 */
export function todayISO(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Piso dos campos de data de nascimento — evita ano de 5+ dígitos no `type="date"`. */
export const BIRTH_DATE_MIN = '1900-01-01';
