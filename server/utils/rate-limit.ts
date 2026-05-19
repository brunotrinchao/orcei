const stores = new Map<string, Map<string, { count: number, reset: number }>>()

// Periodic cleanup to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const store of stores.values()) {
    for (const [ip, record] of store.entries()) {
      if (now > record.reset) {
        store.delete(ip)
      }
    }
  }
}, 60 * 60 * 1000).unref() // Every hour, unref so it doesn't block process exit

export interface RateLimitOptions {
  max: number
  windowMs: number
  keyPrefix?: string
}

export function useRateLimit(event: any, opts: RateLimitOptions) {
  const ip = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || 'anonymous'
  const prefix = opts.keyPrefix || 'global'
  
  if (!stores.has(prefix)) {
    stores.set(prefix, new Map())
  }
  
  const store = stores.get(prefix)!
  const now = Date.now()
  const record = store.get(ip)
  
  if (!record || now > record.reset) {
    const newRecord = {
      count: 1,
      reset: now + opts.windowMs
    }
    store.set(ip, newRecord)
    return { success: true, remaining: opts.max - 1 }
  }
  
  record.count++
  
  if (record.count > opts.max) {
    return { success: false, remaining: 0, reset: record.reset }
  }
  
  return { success: true, remaining: opts.max - record.count }
}

export function checkRateLimit(event: any, opts: RateLimitOptions) {
  const result = useRateLimit(event, opts)
  
  if (!result.success) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Muitas requisições. Tente novamente em breve.',
      data: { resetAt: new Date(result.reset!).toISOString() }
    })
  }
  
  return result
}
