import { useRuntimeConfig } from '#imports'

export interface AssinafyDocumentRequest {
  proposal: any
  profile: any
  pdfBase64?: string
}

export interface AssinafyDocumentResponse {
  documentId: string
  signingUrl: string
  status: 'pending' | 'signed' | 'rejected' | 'canceled'
  provider: 'assinafy'
}

export const AssinafyService = {
  /**
   * Retorna a URL base conforme o ambiente (sandbox ou produção)
   */
  getBaseUrl(): string {
    const config = useRuntimeConfig()
    const env = config.assinafyEnvironment || 'sandbox'
    return env === 'production'
      ? 'https://api.assinafy.com.br/v1'
      : 'https://sandbox.assinafy.com.br/v1'
  },

  /**
   * Retorna a chave de API Master configurada no servidor
   */
  getApiKey(): string {
    const config = useRuntimeConfig()
    return config.assinafyApiKey || ''
  },

  /**
   * Cria e solicita a assinatura eletrônica de uma proposta comercial
   */
  async createAndSendDocument(params: AssinafyDocumentRequest): Promise<AssinafyDocumentResponse> {
    const { proposal, profile } = params
    const apiKey = this.getApiKey()
    const baseUrl = this.getBaseUrl()

    // Se a chave de API não estiver configurada no servidor, opera em modo Simulação/Demo
    if (!apiKey) {
      const mockDocId = `doc_assinafy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const mockSigningUrl = `${baseUrl.replace('/v1', '')}/sign/${mockDocId}?t=${proposal.token || 'demo'}`

      return {
        documentId: mockDocId,
        signingUrl: mockSigningUrl,
        status: 'pending',
        provider: 'assinafy'
      }
    }

    try {
      const payload = {
        title: `Orçamento #${proposal.code || proposal.sequenceNumber} - ${proposal.title}`,
        description: `Contrato de Prestação de Serviços / Orçamento emitido por ${profile.name || 'Orcei Fácil'}`,
        external_id: proposal._id?.toString(),
        sender: {
          name: profile.name || 'Orcei Fácil',
          email: profile.email || 'atendimento@orceifacil.com.br'
        },
        signers: [
          {
            name: proposal.client.name,
            email: proposal.client.email,
            phone: proposal.client.phone ? `+55${proposal.client.phone.replace(/\D/g, '')}` : undefined,
            role: 'signer',
            action: 'sign'
          }
        ],
        file: params.pdfBase64 ? { content: params.pdfBase64, name: `orcamento_${proposal.code || proposal.sequenceNumber}.pdf` } : undefined,
        auto_send: true
      }

      const response: any = await $fetch(`${baseUrl}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: payload
      })

      return {
        documentId: response.id || response.documentId,
        signingUrl: response.signing_url || response.signingUrl || `${baseUrl}/sign/${response.id}`,
        status: 'pending',
        provider: 'assinafy'
      }
    } catch (error: any) {
      console.error('[AssinafyService] Erro ao criar documento na Assinafy:', error?.data || error?.message || error)
      throw new Error(`Falha ao conectar com o serviço de assinatura eletrônica (Assinafy): ${error?.message || 'Erro desconhecido'}`)
    }
  },

  /**
   * Consulta os dados e o status atual do documento na Assinafy
   */
  async getDocument(documentId: string): Promise<any> {
    const apiKey = this.getApiKey()
    const baseUrl = this.getBaseUrl()

    if (!apiKey || documentId.startsWith('doc_assinafy_')) {
      return { id: documentId, status: 'pending' }
    }

    try {
      return await $fetch(`${baseUrl}/documents/${documentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
    } catch (error) {
      console.error('[AssinafyService] Erro ao consultar documento:', error)
      throw error
    }
  },

  /**
   * Baixa o documento PDF assinado com o manifesto de assinaturas
   */
  async downloadSignedDocument(documentId: string): Promise<Buffer | null> {
    const apiKey = this.getApiKey()
    const baseUrl = this.getBaseUrl()

    if (!apiKey || documentId.startsWith('doc_assinafy_')) {
      return null
    }

    try {
      const response: any = await $fetch(`${baseUrl}/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        responseType: 'arrayBuffer'
      })

      return Buffer.from(response)
    } catch (error) {
      console.error('[AssinafyService] Erro ao baixar PDF assinado:', error)
      return null
    }
  }
}
