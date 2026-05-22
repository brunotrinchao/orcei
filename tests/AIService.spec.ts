import { describe, it, expect, vi } from 'vitest'

vi.stubGlobal('useRuntimeConfig', () => ({
  geminiApiKey: '',
  cloudflareAccountId: '',
  cloudflareApiKey: ''
}))

import { AIService } from '../server/services/AIService'

describe('AIService Fallback', () => {
  it('identifica falta de credenciais', async () => {
    await expect(AIService.generateWithCloudflare('test'))
      .rejects.toThrow('Cloudflare credentials not configured for fallback')
  })
})
