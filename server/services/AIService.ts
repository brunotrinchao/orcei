import { GoogleGenerativeAI } from '@google/generative-ai'

export const AIService = {
  _getConfig() {
    return useRuntimeConfig()
  },

  async generateDescription(prompt: string) {
    const config = this._getConfig()
    
    try {
      // 1. Tentar Gemini
      if (config.geminiApiKey) {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey)
        // gemini-1.5-flash foi descontinuado, migrando para gemini-2.5-flash
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.2,
            topP: 0.85,
            topK: 30,
            maxOutputTokens: 1500
          }
        })
        
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()
        
        // Verificar se casa com o regex de fallback do Cloudflare (ex: se for uma resposta padrão indesejada)
        const fallbackRegex = config.cloudflareFallbackRegex
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

  async extractClientInfo(text: string) {
    const config = this._getConfig()
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

    try {
      if (config.geminiApiKey) {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey)
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-flash',
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        })
        const result = await model.generateContent(prompt)
        return result.response.text()
      }
    } catch (e) {
      console.error('Gemini client extraction error:', e)
    }

    // Fallback: Tentar Cloudflare se o Gemini falhar
    const response = await this.generateWithCloudflare(prompt)
    try {
      let cleanJson = response.trim()
      cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim()
      const jsonStart = cleanJson.indexOf('{')
      const jsonEnd = cleanJson.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return cleanJson.substring(jsonStart, jsonEnd + 1)
      }
      return cleanJson
    } catch (e) {
      return response
    }
  },

  async suggestProposalItems(prompt: string, catalog: any[]) {
    const config = this._getConfig()
    
    try {
      if (config.geminiApiKey) {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey)
        // gemini-1.5-pro foi descontinuado, migrando para gemini-2.5-pro para lógica complexa
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.5-pro',
          generationConfig: {
            temperature: 0.2,
            topP: 0.85,
            topK: 30,
            maxOutputTokens: 1500,
            responseMimeType: "application/json"
          }
        })

        const systemInstructions = this.getPrompt(prompt, catalog)

        const result = await model.generateContent([
          { text: systemInstructions },
          { text: `Pedido do Cliente: "${prompt}"` }
        ])

        return result.response.text()
      }
    } catch (e) {
      console.error('Gemini suggest error:', e)
    }

    // Fallback para Cloudflare se Gemini falhar ou não estiver configurado
    console.log('Gemini failed or not configured. Switching to Cloudflare for proposal suggestion.')
    const cloudflarePrompt = this.getPrompt(prompt, catalog)

    const response = await this.generateWithCloudflare(cloudflarePrompt)

    // Limpar markdown ou texto extra que a Cloudflare possa ter enviado
    try {
      let cleanJson = response.trim()
      
      // Remover blocos de código markdown
      cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim()
      
      // Isolar o objeto JSON encontrando as chaves
      const jsonStart = cleanJson.indexOf('{')
      const jsonEnd = cleanJson.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        return cleanJson.substring(jsonStart, jsonEnd + 1)
      }
      
      return cleanJson
    } catch (e) {
      console.error('[AIService] Failed to clean Cloudflare JSON:', e)
      return response
    }
  },

  async generateWithCloudflare(prompt: string) {
    const config = this._getConfig()
    const { cloudflareAccountId: accountId, cloudflareApiKey: apiKey, cloudflareAiModel: model } = config

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
              { role: 'system', content: 'Você é um redator profissional de orçamentos comerciais.' },
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
    `;
  }
}
