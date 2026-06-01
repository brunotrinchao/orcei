import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { createError, getHeader } from 'h3'

export interface RateLimitOptions {
  max: number
  windowMs: number
  keyPrefix?: string
}

// Cache de instâncias Ratelimit por chave de configuração
const rateLimiters = new Map<string, Ratelimit>()

// Fallback in-memory para desenvolvimento (sem Redis configurado)
const inMemoryStore = new Map<string, { count: number; resetAt: number }>()

function getInMemoryLimiter(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = inMemoryStore.get(key)
  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

function getRateLimiter(max: number, windowMs: number): Ratelimit | null {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!redisUrl || !redisToken) return null

  const windowSeconds = Math.round(windowMs / 1000)
  const cacheKey = `${max}:${windowSeconds}`
  if (!rateLimiters.has(cacheKey)) {
    const redis = new Redis({ url: redisUrl, token: redisToken })
    rateLimiters.set(cacheKey, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSeconds} s`),
      analytics: false,
    }))
  }
  return rateLimiters.get(cacheKey)!
}

export async function checkRateLimit(event: any, opts: RateLimitOptions): Promise<void> {
  const ip = getHeader(event, 'x-forwarded-for') || event.node?.req?.socket?.remoteAddress || 'anonymous'
  const prefix = opts.keyPrefix || 'global'
  const identifier = `${prefix}:${ip}`

  const limiter = getRateLimiter(opts.max, opts.windowMs)

  if (!limiter) {
    const allowed = getInMemoryLimiter(identifier, opts.max, opts.windowMs)
    if (!allowed) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Muitas requisições. Tente novamente em breve.',
      })
    }
    return
  }

  const { success } = await limiter.limit(identifier)
  if (!success) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Muitas requisições. Tente novamente em breve.',
    })
  }
}
