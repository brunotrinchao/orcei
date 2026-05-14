import { GoogleGenerativeAI } from '@google/generative-ai'

export const AIService = {
  async generateDescription(prompt: string) {
    const config = useRuntimeConfig()
    
    try {
      // 1. Tentar Gemini
      if (config.geminiApiKey) {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        // Verificar se casa com o regex de fallback do Cloudflare (ex: se for uma resposta padrão indesejada)
        const fallbackRegex = process.env.CLOUDFLARE_FALLBACK_REGEX
        if (fallbackRegex && fallbackRegex !== 'true' && new RegExp(fallbackRegex, 'i').test(text)) {
          console.log('Gemini response matched fallback regex. Switching to Cloudflare.')
          return await this.generateWithCloudflare(prompt)
        }
        
        return text
      }
    } catch (e) {
      console.error('Gemini error:', e)
    }

    // 2. Fallback para Cloudflare
    return await this.generateWithCloudflare(prompt)
  },

  async generateWithCloudflare(prompt: string) {
    const config = useRuntimeConfig()
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiKey = process.env.CLOUDFLARE_API_KEY
    const model = process.env.CLOUDFLARE_AI_MODEL || '@cf/meta/llama-2-7b-chat-int8'

    if (!accountId || !apiKey) {
      throw new Error('Cloudflare credentials not configured for fallback')
    }

    try {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'Você é um redator profissional de propostas comerciais.' },
              { role: 'user', content: prompt }
            ]
          })
        }
      )

      const result: any = await response.json()
      if (result.success) {
        return result.result.response
      }
      throw new Error('Cloudflare AI failed')
    } catch (e) {
      console.error('Cloudflare error:', e)
      throw e
    }
  }
}
