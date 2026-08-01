import { GoogleGenerativeAI } from '@google/generative-ai'
import { AiUsageLog } from '../models/AiUsageLog'
import { estimateCostUsd } from '../utils/aiPricing'

export type AiUsageMeta = { profileId?: string; action?: string }

type ProviderName = 'deepseek' | 'gemini' | 'cloudflare' | 'openrouter'

// Cadeia de fallback FIXA: DeepSeek → Gemini → Cloudflare → OpenRouter.
// Cada provedor é ligado/desligado por variável de ambiente própria (ver
// nuxt.config.ts: useDeepseek/useGemini/useCloudflare/useOpenrouter). Se um
// provedor habilitado falhar (ou não estiver configurado), o próximo da
// lista é tentado automaticamente, sucessivamente, até esgotar as opções.
const PROVIDER_ORDER: ProviderName[] = ['deepseek', 'gemini', 'cloudflare', 'openrouter']

export const AIService = {
  _getConfig() {
    return useRuntimeConfig()
  },

  /**
   * Registra o uso real de um provedor de IA de forma NÃO BLOQUEANTE — falha de
   * log é logada no console mas NUNCA propaga/atrasa a resposta da IA.
   */
  _logUsage(entry: {
    provider: ProviderName
    model: string
    success: boolean
    tokensInput?: number
    tokensOutput?: number
    latencyMs?: number
    errorMessage?: string
    meta?: AiUsageMeta
  }) {
    try {
      const tokensInput = entry.tokensInput || 0
      const tokensOutput = entry.tokensOutput || 0
      AiUsageLog.create({
        profileId: entry.meta?.profileId || null,
        provider: entry.provider,
        model: entry.model,
        action: entry.meta?.action,
        tokensInput,
        tokensOutput,
        estimatedCostUsd: estimateCostUsd(entry.model, tokensInput, tokensOutput),
        success: entry.success,
        errorMessage: entry.errorMessage,
        latencyMs: entry.latencyMs
      }).catch(err => console.error('[AiUsageLog] Falha ao registrar:', err))
    } catch (err) {
      console.error('[AiUsageLog] Falha ao registrar:', err)
    }
  },

  // Só checa a flag de ligar/desligar — ausência de API key é tratada dentro
  // de cada generateWithX (já lança erro claro), e cai naturalmente pro
  // próximo provedor da cadeia via _generateWithFallback.
  _isProviderEnabled(provider: ProviderName, config: any): boolean {
    switch (provider) {
      case 'deepseek': return !!config.useDeepseek
      case 'gemini': return config.useGemini !== false
      case 'cloudflare': return config.useCloudflare !== false
      case 'openrouter': return config.useOpenrouter !== false
    }
  },

  /**
   * Executa a cadeia DeepSeek → Gemini → Cloudflare → OpenRouter, pulando
   * provedores desligados e tentando o próximo sempre que um falhar (erro de
   * config, erro de rede, resposta vazia, etc). Lança o último erro só se
   * TODOS os provedores habilitados falharem.
   *
   * `opts.isAcceptable`, se informado, permite rejeitar uma resposta que
   * tecnicamente teve sucesso mas não deve ser aceita (ex: Gemini retornando
   * um texto que casa com o regex de qualidade configurado) — nesse caso
   * também segue pro próximo provedor da cadeia.
   */
  async _generateWithFallback(prompt: string, opts: {
    maxTokens?: number
    geminiContents?: any
    geminiGenerationConfig?: any
    meta?: AiUsageMeta
    isAcceptable?: (text: string, provider: ProviderName) => boolean
  } = {}): Promise<string> {
    const config = this._getConfig()
    const maxTokens = opts.maxTokens ?? 8192
    let lastError: any = null

    for (const provider of PROVIDER_ORDER) {
      if (!this._isProviderEnabled(provider, config)) continue

      try {
        let text: string
        if (provider === 'gemini') {
          text = await this._callGemini(prompt, maxTokens, opts.geminiGenerationConfig, opts.geminiContents, opts.meta)
        } else if (provider === 'deepseek') {
          text = await this.generateWithDeepSeek(prompt, maxTokens, opts.meta)
        } else if (provider === 'cloudflare') {
          text = await this.generateWithCloudflare(prompt, maxTokens, opts.meta)
        } else {
          text = await this.generateWithOpenRouter(prompt, maxTokens, opts.meta)
        }

        if (opts.isAcceptable && !opts.isAcceptable(text, provider)) {
          console.log(`[AIService] Resposta do provedor "${provider}" não passou no filtro de qualidade, tentando próximo da cadeia.`)
          continue
        }

        return text
      } catch (e) {
        console.error(`[AIService] Provedor "${provider}" falhou, tentando próximo da cadeia:`, e)
        lastError = e
        continue
      }
    }

    throw lastError || createError({ statusCode: 502, statusMessage: 'Nenhum provedor de IA disponível ou configurado.' })
  },

  async _callGemini(prompt: string, maxTokens: number, generationConfig: any, contents: any, meta?: AiUsageMeta): Promise<string> {
    const config = this._getConfig()
    if (!config.geminiApiKey) throw new Error('Gemini API key not configured')

    const genAI = new GoogleGenerativeAI(config.geminiApiKey)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: generationConfig || {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: maxTokens
      }
    })

    const startedAt = Date.now()
    try {
      const result = contents ? await model.generateContent(contents) : await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      this._logUsage({
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        success: true,
        tokensInput: response.usageMetadata?.promptTokenCount,
        tokensOutput: response.usageMetadata?.candidatesTokenCount,
        latencyMs: Date.now() - startedAt,
        meta
      })
      return text
    } catch (e) {
      this._logUsage({ provider: 'gemini', model: 'gemini-2.5-flash', success: false, latencyMs: Date.now() - startedAt, errorMessage: (e as Error)?.message, meta })
      throw e
    }
  },

  // Isola/limpa um JSON possivelmente cercado de markdown/texto extra (comum
  // em modelos sem "modo JSON" nativo, ex: DeepSeek/Cloudflare/OpenRouter).
  // Aplicar isso num JSON já limpo (ex: saída do Gemini em responseMimeType
  // "application/json") é inofensivo/idempotente — não altera o resultado.
  _cleanJsonResponse(response: string, sanitizeWhitespace = true): string {
    try {
      let cleanJson = response.trim()
      cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim()
      const jsonStart = cleanJson.indexOf('{')
      const jsonEnd = cleanJson.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const isolated = cleanJson.substring(jsonStart, jsonEnd + 1)
        // Sanitiza quebras de linha/tabs literais dentro das strings do JSON
        // (comum em modelos sem modo JSON), que quebram o parser com "Unterminated string".
        return sanitizeWhitespace ? isolated.replace(/[\n\r\t]/g, ' ') : isolated
      }
      return cleanJson
    } catch (e) {
      console.error('[AIService] Failed to clean JSON response:', e)
      return response
    }
  },

  async generateDescription(prompt: string, maxTokens: number = 8192, meta?: AiUsageMeta) {
    const config = this._getConfig()
    const fallbackRegex = config.cloudflareFallbackRegex

    return this._generateWithFallback(prompt, {
      maxTokens,
      meta,
      // Regra de qualidade pré-existente: se o Gemini retornar um texto que
      // case com o regex configurado (resposta padrão indesejada), não aceita
      // e segue pro próximo provedor — só se aplica ao Gemini.
      isAcceptable: (text, provider) => {
        if (provider !== 'gemini') return true
        if (!fallbackRegex || fallbackRegex === 'true') return true
        return !new RegExp(fallbackRegex, 'i').test(text)
      }
    })
  },

  async extractClientInfo(text: string, meta?: AiUsageMeta) {
    const prompt = `
      Você é um assistente comercial e especialista em extração de informações.
      Analise o texto abaixo, que representa uma mensagem de cliente, e-mail ou transcrição de áudio, e extraia de forma estruturada as informações de contato.

      Texto do Cliente:
      "${text}"

      Extraia as seguintes informações em formato JSON:
      - name: Nome do cliente (ou o nome da empresa se o nome pessoal não for encontrado, NUNCA deixe vazio)
      - email: E-mail de contato do cliente (se encontrado)
      - phone: Telefone/WhatsApp do cliente (se encontrado, formate com DDD + número, apenas números)
      - segment: Segmento/Nicho de atuação da empresa (se mencionado)
      - companySize: Porte da empresa (ex: Pequena, Média, Grande, se mencionado)

      Responda EXCLUSIVAMENTE com o JSON abaixo.
      Não inclua explicações, markdown ou blocos de código.
      O primeiro caractere da resposta deve ser { e o último deve ser }.

      {
        "name": "<string>",
        "email": "<string | null>",
        "phone": "<string | null>",
        "segment": "<string | null>",
        "companySize": "<string | null>"
      }
    `

    const raw = await this._generateWithFallback(prompt, {
      maxTokens: 8192,
      meta,
      geminiGenerationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
    })

    return this._cleanJsonResponse(raw, false)
  },

  async suggestProposalItems(prompt: string, catalog: any[], meta?: AiUsageMeta) {
    const systemInstructions = this.getPrompt(prompt, catalog)

    const raw = await this._generateWithFallback(systemInstructions, {
      maxTokens: 8192,
      meta,
      geminiGenerationConfig: {
        temperature: 0.2,
        topP: 0.85,
        topK: 30,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 }
      },
      geminiContents: [
        { text: systemInstructions },
        { text: `Pedido do Cliente: "${prompt}"` }
      ]
    })

    return this._cleanJsonResponse(raw, true)
  },

  async generateWithCloudflare(prompt: string, maxTokens: number = 8192, meta?: AiUsageMeta) {
    const config = this._getConfig()
    const { cloudflareAccountId: accountId, cloudflareApiKey: apiKey, cloudflareAiModel: model } = config

    if (!accountId || !apiKey) {
      throw new Error('Cloudflare credentials not configured for fallback')
    }

    const startedAt = Date.now()
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
              { role: 'system', content: 'Você é um redator profissional de orçamentos comerciais.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: maxTokens
          })
        }
      )

      const result: any = await response.json()
      if (result.success) {
        const output = result.result.response
        // Cloudflare Workers AI nem sempre retorna contagem de tokens; se ausente, grava 0.
        const usage = result.result?.usage || {}
        this._logUsage({
          provider: 'cloudflare',
          model: String(model),
          success: true,
          tokensInput: usage.prompt_tokens || 0,
          tokensOutput: usage.completion_tokens || 0,
          latencyMs: Date.now() - startedAt,
          meta
        })
        return typeof output === 'string' ? output : JSON.stringify(output)
      }
      throw new Error('Cloudflare AI failed')
    } catch (e) {
      console.error('Cloudflare error:', e)
      this._logUsage({ provider: 'cloudflare', model: String(model), success: false, latencyMs: Date.now() - startedAt, errorMessage: (e as Error)?.message, meta })
      throw e
    }
  },

  async generateWithOpenRouter(prompt: string, maxTokens: number = 8192, meta?: AiUsageMeta) {
    const config = this._getConfig()
    const { openrouterApiKey: apiKey, openrouterModel: model } = config

    if (!apiKey) {
      throw new Error('OpenRouter credentials not configured for fallback')
    }

    const startedAt = Date.now()
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Você é um redator profissional de orçamentos comerciais.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens
        })
      })

      const result: any = await response.json()
      const output = result.choices?.[0]?.message?.content
      if (!output) throw new Error('OpenRouter AI failed')
      this._logUsage({
        provider: 'openrouter',
        model: String(model),
        success: true,
        tokensInput: result.usage?.prompt_tokens || 0,
        tokensOutput: result.usage?.completion_tokens || 0,
        latencyMs: Date.now() - startedAt,
        meta
      })
      return output
    } catch (e) {
      console.error('OpenRouter error:', e)
      this._logUsage({ provider: 'openrouter', model: String(model), success: false, latencyMs: Date.now() - startedAt, errorMessage: (e as Error)?.message, meta })
      throw e
    }
  },

  async generateWithDeepSeek(prompt: string, maxTokens: number = 8192, meta?: AiUsageMeta) {
    const config = this._getConfig()
    const apiKey = config.deepseekApiKey
    const model = config.deepseekModel || 'deepseek-chat'

    if (!apiKey) {
      throw new Error('DeepSeek credentials not configured')
    }

    const startedAt = Date.now()
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Você é um redator profissional de orçamentos comerciais.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens
        })
      })

      const result: any = await response.json()
      const output = result.choices?.[0]?.message?.content
      if (!output) throw new Error(`DeepSeek API failed: ${JSON.stringify(result.error || result)}`)
      this._logUsage({
        provider: 'deepseek',
        model,
        success: true,
        tokensInput: result.usage?.prompt_tokens || 0,
        tokensOutput: result.usage?.completion_tokens || 0,
        latencyMs: Date.now() - startedAt,
        meta
      })
      return output
    } catch (e) {
      this._logUsage({ provider: 'deepseek', model, success: false, latencyMs: Date.now() - startedAt, errorMessage: (e as Error)?.message, meta })
      throw e
    }
  },

  getPrompt(prompt: string, catalog: any[]) {
    return `
      Você é um especialista em precificação para freelancers brasileiros.
      Sua única função é decompor pedidos de clientes em itens de orçamento estruturados.

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      PEDIDO DO USUARIO:
      ${prompt}
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      CATÁLOGO DO PROFISSIONAL (fonte primária):
      ${JSON.stringify(catalog, null, 2)}
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      PROTOCOLO DE DECISÃO (siga esta ordem obrigatoriamente):

      PASSO 1 — MATCHING SEMÂNTICO DO CATÁLOGO
      Para cada entrega identificada no pedido, verifique se existe um item no catálogo
      cujo escopo seja equivalente ou sobreponível — mesmo que o nome seja diferente.
      Critério: "Este item do catálogo cobre a maior parte desta entrega?" → Se SIM, use-o.
      Ao reutilizar: copie name e price EXATAMENTE. Ajuste apenas quantity e description.

      PASSO 2 — CRIAÇÃO DE ITENS AUSENTES
      Somente para entregas sem cobertura no catálogo, crie novos itens.
      Use os seguintes benchmarks de precificação para freelancers no Brasil (2024):
      - Desenvolvimento Web (por hora): R$ 80–200/h (júnior–sênior)
      - Design UI/UX (por hora): R$ 70–180/h
      - Redação/Copywriting (por página): R$ 80–300
      - Treinamento/Mentoria (por sessão 2h): R$ 250–600
      - SEO (pacote mensal): R$ 800–3.000
      - Gestão de Tráfego (mensal): R$ 600–2.500
      - Identidade Visual (pacote): R$ 1.200–4.000
      Posicione o preço no percentil 50 (mediana) do range, a menos que o pedido indique
      complexidade alta (use percentil 75) ou baixa (use percentil 25).

      PASSO 3 — QUALIDADE DAS DESCRIÇÕES
      Cada description deve conter:
      (a) O que será entregue (tangível)
      (b) Uma característica técnica relevante ao pedido
      (c) O benefício direto para o cliente
      Máximo: 2 frases. Proibido: termos vagos como "completo", "profissional", "de qualidade".

      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      FORMATO DE SAÍDA — OBRIGATÓRIO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      Responda EXCLUSIVAMENTE com o JSON abaixo.
      Não inclua explicações, markdown, blocos de código ou qualquer texto fora do JSON.
      O primeiro caractere da resposta deve ser { e o último deve ser }.

      {
      "reasoning": "<string: 1-2 frases explicando as principais decisões de matching>",
      "items": [
        {
          "source": "catalog" | "new",
          "name": "<string>",
          "description": "<string: máx. 2 frases seguindo o protocolo acima>",
          "price": <number: valor unitário em BRL, sem símbolo>,
          "unit": "H" | "UN" | "MÊS" | "PÁG",
          "quantity": <number>,
          "price_rationale": "<string: obrigatório apenas quando source = 'new', justificando o preço>"
        }
      ]
      }
    `
  }
}
