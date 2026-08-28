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

  it('pula deepseek quando meta.cost é 0 (operação gratuita)', async () => {
    const spyConfig = vi.spyOn(AIService, '_getConfig').mockReturnValue({
      useDeepseek: true,
      useGemini: true,
      geminiApiKey: 'mock-gemini-key'
    })

    const spyDeepseek = vi.spyOn(AIService, 'generateWithDeepSeek').mockResolvedValue('resposta deepseek')
    const spyGemini = vi.spyOn(AIService, '_callGemini').mockResolvedValue('resposta gemini')

    const result = await AIService._generateWithFallback('prompt teste', {
      meta: { cost: 0, action: 'catalogSuggest' }
    })

    expect(result).toBe('resposta gemini')
    expect(spyDeepseek).not.toHaveBeenCalled()
    expect(spyGemini).toHaveBeenCalled()

    spyConfig.mockRestore()
    spyDeepseek.mockRestore()
    spyGemini.mockRestore()
  })

  it('utiliza deepseek quando meta.cost é maior que 0', async () => {
    const spyConfig = vi.spyOn(AIService, '_getConfig').mockReturnValue({
      useDeepseek: true,
      useGemini: true,
      deepseekApiKey: 'mock-deepseek-key'
    })

    const spyDeepseek = vi.spyOn(AIService, 'generateWithDeepSeek').mockResolvedValue('resposta deepseek')
    const spyGemini = vi.spyOn(AIService, '_callGemini').mockResolvedValue('resposta gemini')

    const result = await AIService._generateWithFallback('prompt teste', {
      meta: { cost: 1, action: 'catalogSuggest' }
    })

    expect(result).toBe('resposta deepseek')
    expect(spyDeepseek).toHaveBeenCalled()

    spyConfig.mockRestore()
    spyDeepseek.mockRestore()
    spyGemini.mockRestore()
  })
})
