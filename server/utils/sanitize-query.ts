/**
 * Utilitário de Sanitização contra NoSQL Injection.
 * Remove recursivamente chaves que comecem com '$' de objetos vindos do req body ou query.
 */
export function sanitizeQuery<T>(input: T): T {
  if (input === null || typeof input !== 'object') {
    return input
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizeQuery(item)) as unknown as T
  }

  const sanitized: Record<string, any> = {}

  for (const [key, value] of Object.entries(input)) {
    // Bloquear chaves com operadores com cifrão ($) para evitar injeções NoSQL
    if (key.startsWith('$')) {
      continue
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeQuery(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized as T
}
