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
