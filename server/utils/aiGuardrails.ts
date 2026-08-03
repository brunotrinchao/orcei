import type { H3Event } from 'h3'

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|as)\s+instruction/i,
  /ignore\s+as\s+instruç/i,
  /desconsidere\s+as\s+instruç/i,
  /forget\s+(your\s+)?role/i,
  /esqueça\s+seu\s+papel/i,
  /act\s+as\s+a/i,
  /override\s+system/i,
  /system\s+prompt/i,
  /você\s+agora\s+é/i
]

/**
 * Sanitiza a entrada do usuário para requisições de IA.
 * 1. Trunca o texto no tamanho máximo definido.
 * 2. Remove caracteres de controle invisíveis e nulos.
 * 3. Substitui cercas de markdown para evitar JSON Injection.
 * 4. Valida contra padrões comuns de Prompt Injection / Jailbreak.
 */
export function sanitizeAiInput(text: string, maxLength = 4000): string {
  if (!text) return ''

  // 1. Truncamento estrito por tamanho
  let sanitized = String(text).slice(0, maxLength)

  // 2. Remoção de caracteres de controle invisíveis/nulos (preserva \n, \r, \t)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')

  // 3. Substituição de cercas de código markdown para evitar contaminação do parser JSON
  sanitized = sanitized.replace(/```/g, "'''")

  // 4. Detecção preventiva de Prompt Injection (normalizado sem acentos)
  const normalized = sanitized.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized) || pattern.test(normalized)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Entrada inválida ou comando não permitido detectado no texto.'
      })
    }
  }

  return sanitized.trim()
}

const rateLimitStore = new Map<string, { count: number; expiresAt: number }>()

/**
 * Rate Limiter simples em memória por IP/Identificador para rotas de IA.
 */
export function checkAiRateLimit(event: H3Event, maxRequests = 15, windowMs = 60_000): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
  const now = Date.now()

  const record = rateLimitStore.get(ip) || { count: 0, expiresAt: now + windowMs }

  if (now > record.expiresAt) {
    record.count = 1
    record.expiresAt = now + windowMs
  } else {
    record.count += 1
  }

  rateLimitStore.set(ip, record)

  if (record.count > maxRequests) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Muitas requisições enviadas para os serviços de IA. Aguarde um momento antes de tentar novamente.'
    })
  }
}
