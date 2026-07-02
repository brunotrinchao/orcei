/**
 * Sanitiza erros antes de expô-los ao cliente.
 * Loga o erro completo no servidor (debug) e retorna uma mensagem genérica e segura.
 * Uso: throw sanitizeError(error, 'Mensagem genérica para o usuário')
 */
export function sanitizeError(error: any, fallbackMessage: string, statusCode = 500) {
  console.error('[sanitizeError]', error)
  return createError({ statusCode, statusMessage: fallbackMessage })
}
