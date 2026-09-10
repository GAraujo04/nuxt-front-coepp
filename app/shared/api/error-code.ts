import { isAxiosError } from 'axios';

/**
 * Código de erro estável devolvido pelo backend ({ code, message,
 * correlation_id }). Usar o `code` e não a `message`: a mensagem é texto
 * pra humano e pode mudar sem aviso; o código é contrato.
 */
export function apiErrorCode(error: unknown): string | null {
  if (!isAxiosError<{ code?: string }>(error)) return null;
  return error.response?.data?.code ?? null;
}

/**
 * Rate limit ou bloqueio temporário por tentativas falhas (HTTP 429).
 *
 * Importa distinguir isto de credencial inválida na interface: as telas de
 * login mostravam "senha inválida" para QUALQUER erro, então um usuário
 * barrado por excesso de tentativas era mandado trocar uma senha que
 * estava certa o tempo todo — e tentava de novo, prolongando o bloqueio.
 */
export function isRateLimited(error: unknown): boolean {
  return apiErrorCode(error) === 'rate_limited';
}
