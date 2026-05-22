import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AIService } from '../server/services/AIService'

describe('AIService Fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('identifica falta de credenciais', async () => {
    // Interceptar o método interno de configuração para simular falta de credenciais
    const spy = vi.spyOn(AIService, '_getConfig').mockReturnValue({
      geminiApiKey: '',
      cloudflareAccountId: '',
      cloudflareApiKey: '',
      cloudflareAiModel: ''
    })

    await expect(AIService.generateWithCloudflare('test'))
      .rejects.toThrow('Cloudflare credentials not configured for fallback')
    
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
