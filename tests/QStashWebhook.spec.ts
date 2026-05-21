import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocking Nuxt global functions
const mockRuntimeConfig = {
  qstashCurrentSigningKey: '',
  qstashNextSigningKey: ''
}

vi.stubGlobal('useRuntimeConfig', () => mockRuntimeConfig)
vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('getHeaders', vi.fn())
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('createError', (err: any) => err)
vi.stubGlobal('defineEventHandler', (handler: any) => handler)

describe('QStash Webhook Integration', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const module = await import('../server/api/webhooks/qstash.post')
    handler = module.default
  })

  it('should throw 400 if action header is missing', async () => {
    const event = { node: { req: {}, res: {} } } as any
    vi.mocked(getHeaders).mockReturnValue({})
    vi.mocked(readBody).mockResolvedValue({})

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Action missing'
    })
  })

  it('should process a valid TEST_JOB', async () => {
    const event = { node: { req: {}, res: {} } } as any
    vi.mocked(getHeaders).mockReturnValue({
      'action': 'TEST_JOB'
    })
    vi.mocked(readBody).mockResolvedValue({ foo: 'bar' })
    
    const result = await handler(event)
    expect(result).toEqual({ success: true })
  })
})
