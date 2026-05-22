import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock mongoose partially
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      connection: {
        readyState: 1
      },
      connect: vi.fn(),
      set: vi.fn()
    }
  }
})

// Mocking Nuxt global functions
vi.stubGlobal('useRuntimeConfig', () => ({
  qstashCurrentSigningKey: 'mock',
  qstashNextSigningKey: 'mock'
}))
vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('getHeaders', vi.fn())
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (e: any) => {
  const err = new Error(e.statusMessage || 'Error')
  ;(err as any).statusCode = e.statusCode
  return err
})
vi.stubGlobal('defineEventHandler', (handler: any) => handler)

// Mock Receiver
const { mockVerify } = vi.hoisted(() => ({
  mockVerify: vi.fn().mockResolvedValue(true)
}))
vi.mock('@upstash/qstash', () => {
  class Receiver {
    verify = mockVerify
  }
  return { Receiver }
})

describe('QStash Webhook Integration', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../server/api/webhooks/qstash.post')
    handler = module.default
  })

  it('should throw 400 if action header is missing', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeaders, readBody } = (global as any)
    vi.mocked(getHeaders).mockReturnValue({})
    vi.mocked(readBody).mockResolvedValue({})

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Action missing'
    })
  })

  it('should process a valid TEST_JOB', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeaders, readBody } = (global as any)
    vi.mocked(getHeaders).mockReturnValue({
      'action': 'TEST_JOB'
    })
    vi.mocked(readBody).mockResolvedValue({ foo: 'bar' })
    
    const result = await handler(event)
    expect(result).toEqual({ success: true })
  })
})
