import { useRuntimeConfig } from '#imports'
import { generateProposalPdfBuffer } from '../utils/pdf'

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
   * Retorna a URL base configurada diretamente no .env (ASSINAFY_BASE_URL)
   */
  getBaseUrl(): string {
    const config = useRuntimeConfig()
    return (config.assinafyBaseUrl || 'https://api.assinafy.com.br/v1').replace(/\/$/, '')
  },

  /**
   * Retorna a chave de API Master configurada no servidor
   */
  getApiKey(): string {
    const config = useRuntimeConfig()
    return config.assinafyApiKey || ''
  },

  /**
   * Obtém os cabeçalhos padrão de autenticação de acordo com a especificação da API Assinafy (X-Api-Key)
   */
  getAuthHeaders(): Record<string, string> {
    const apiKey = this.getApiKey()
    return {
      'X-Api-Key': apiKey,
      'Authorization': `Bearer ${apiKey}`
    }
  },

  /**
   * Obtém o Account ID do workspace configurado diretamente no .env (ASSINAFY_ACCOUNT_ID)
   */
  getAccountId(): string {
    const config = useRuntimeConfig()
    return config.assinafyAccountId || ''
  },

  /**
   * Cria o documento, registra o signatário e solicita a assinatura de acordo com os endpoints oficiais da Assinafy API v1:
   * 1. POST /v1/accounts/{accountId}/documents (Upload do PDF)
   * 2. POST /v1/accounts/{accountId}/signers (Criação do Signatário/Cliente)
   * 3. POST /v1/documents/{documentId}/assignments (Criação do Pedido de Assinatura Virtual)
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
      const accountId = this.getAccountId()
      if (!accountId) {
        throw new Error('ID da conta (ASSINAFY_ACCOUNT_ID) não configurado no arquivo .env.')
      }

      // 1. Obter o PDF em Buffer (Base64, Google Drive ou Geração Dinâmica)
      let pdfBuffer: Buffer | null = null

      if (params.pdfBase64) {
        const base64Data = params.pdfBase64.replace(/^data:application\/pdf;base64,/, '')
        pdfBuffer = Buffer.from(base64Data, 'base64')
      } else if (params.proposal.driveFileId) {
        try {
          const fileId = params.proposal.driveFileId
          const response = await fetch(`https://drive.google.com/uc?export=download&id=${fileId}`, { redirect: 'follow' })

          if (response.ok && response.headers.get('content-type')?.includes('application/pdf')) {
            pdfBuffer = Buffer.from(await response.arrayBuffer())
          }
        } catch (driveErr) {
          console.warn('[AssinafyService] Falha ao obter PDF do Google Drive, gerando PDF dinamicamente:', driveErr)
        }
      }

      // Fallback automático: Se não veio base64 nem no Google Drive, gera o PDF da proposta na hora
      if (!pdfBuffer || pdfBuffer.length === 0) {
        pdfBuffer = await generateProposalPdfBuffer(proposal, profile)
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('O arquivo PDF da proposta é obrigatório e não pôde ser obtido/gerado para assinatura.')
      }

      // 2. Upload do documento (POST /v1/accounts/{accountId}/documents)
      const fileName = `orcamento_${proposal.code || proposal.sequenceNumber || 'proposal'}.pdf`
      const formData = new FormData()
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      formData.append('file', blob, fileName)

      const docResponse: any = await $fetch(`${baseUrl}/accounts/${accountId}/documents`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: formData
      })

      const documentData = docResponse?.data || docResponse
      const documentId = documentData?.id
      if (!documentId) {
        throw new Error(`Falha ao registrar documento no Assinafy: ${JSON.stringify(docResponse)}`)
      }

      // 3. Criar Signatário (POST /v1/accounts/{accountId}/signers)
      let rawPhone = proposal.client?.phone ? proposal.client.phone.replace(/\D/g, '') : ''
      if (rawPhone && !rawPhone.startsWith('55')) {
        rawPhone = `55${rawPhone}`
      }

      const signerPayload = {
        full_name: proposal.client?.name || 'Cliente',
        email: proposal.client?.email,
        whatsapp_phone_number: rawPhone ? `+${rawPhone}` : undefined
      }

      const signerResponse: any = await $fetch(`${baseUrl}/accounts/${accountId}/signers`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: signerPayload
      })

      const signerData = signerResponse?.data || signerResponse
      const signerId = signerData?.id
      if (!signerId) {
        throw new Error(`Falha ao registrar signatário no Assinafy: ${JSON.stringify(signerResponse)}`)
      }

      // 4. Solicitar Assinatura (POST /v1/documents/{documentId}/assignments)
      const assignmentPayload = {
        method: 'virtual',
        signers: [
          {
            id: signerId,
            verification_method: 'Email',
            notification_methods: ['Email'],
            step: 1
          }
        ],
        message: `Solicitação de assinatura para o orçamento #${proposal.code || proposal.sequenceNumber}`
      }

      const assignmentResponse: any = await $fetch(`${baseUrl}/documents/${documentId}/assignments`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: assignmentPayload
      })

      const assignmentData = assignmentResponse?.data || assignmentResponse
      const signingUrl = documentData?.signing_url || assignmentData?.signing_url || assignmentData?.signers?.[0]?.signing_url || `${baseUrl}/sign/${documentId}`

      return {
        documentId,
        signingUrl,
        status: 'pending',
        provider: 'assinafy'
      }
    } catch (error: any) {
      const errorDetails = error?.data || error?.response?._data || error?.message || error
      console.error('[AssinafyService] Erro na integração Assinafy:', errorDetails)
      throw new Error(`Falha ao conectar com o serviço de assinatura eletrônica (Assinafy): ${typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails}`)
    }
  },

  /**
   * Consulta os dados e o status atual do documento na Assinafy (GET /v1/documents/{documentId})
   */
  async getDocument(documentId: string): Promise<any> {
    const apiKey = this.getApiKey()
    const baseUrl = this.getBaseUrl()

    if (!apiKey || documentId.startsWith('doc_assinafy_')) {
      return { id: documentId, status: 'pending' }
    }

    try {
      const response: any = await $fetch(`${baseUrl}/documents/${documentId}`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })
      return response?.data || response
    } catch (error) {
      console.error('[AssinafyService] Erro ao consultar documento:', error)
      throw error
    }
  },

  /**
   * Baixa o documento PDF assinado (GET /v1/documents/{documentId}/download/signed)
   */
  async downloadSignedDocument(documentId: string): Promise<Buffer | null> {
    const apiKey = this.getApiKey()
    const baseUrl = this.getBaseUrl()

    if (!apiKey || documentId.startsWith('doc_assinafy_')) {
      return null
    }

    try {
      const response: any = await $fetch(`${baseUrl}/documents/${documentId}/download/signed`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
        responseType: 'arrayBuffer'
      })

      return Buffer.from(response)
    } catch (error) {
      console.error('[AssinafyService] Erro ao baixar PDF assinado:', error)
      return null
    }
  }
}
