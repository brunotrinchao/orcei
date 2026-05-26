import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = {
        send: mockSend
      }
    }
  }
})

describe('Email Service Integration (Resend Templates & HTML Fallbacks)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 're_mock_api_key_123'
    process.env.RESEND_TEST_TO = '' // Default empty
    
    // Reset runtimeConfig overrides to ensure fallbacks are used by default
    const config = useRuntimeConfig()
    config.resendTemplateWelcome = 'bem-vindo'
    config.resendTemplateBackup = 'backup'
    config.resendTemplateBuyCredit = 'comprar-credito'
    config.resendTemplateProposal = 'proposta'
  })

  it('should successfully send welcome email using unified HTML template fallback', async () => {
    const { sendWelcomeEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({ data: { id: 'send_welcome_id_123' }, error: null })

    const result = await sendWelcomeEmail('freelancer@test.com', 'Bruno Trinchão')

    expect(result).toEqual({ id: 'send_welcome_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Orcei Fácil <contato@orceifacil.com.br>',
        to: 'freelancer@test.com',
        subject: 'Bem-vindo ao Orcei Fácil!',
        html: expect.stringContaining('<table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper"')
      })
    )
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Seja muito bem-vindo<br>ao Orcei')
      })
    )
  })

  it('should successfully send backup data email using unified HTML template fallback', async () => {
    const { sendBackupEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({ data: { id: 'send_backup_id_123' }, error: null })

    const mockBuffer = Buffer.from('mock_zip_content')
    const result = await sendBackupEmail('freelancer@test.com', 'Bruno Trinchão', mockBuffer)

    expect(result).toEqual({ id: 'send_backup_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Orcei Fácil <contato@orceifacil.com.br>',
        to: 'freelancer@test.com',
        subject: 'Seu Backup de Dados - Orcei Fácil',
        html: expect.stringContaining('<table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-wrapper"'),
        attachments: expect.arrayContaining([
          expect.objectContaining({
            filename: expect.stringContaining('.zip'),
            content: mockBuffer
          })
        ])
      })
    )
  })

  it('should successfully send credit purchase email matching user layout exactly', async () => {
    const { sendCreditPurchaseEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({ data: { id: 'send_credit_id_123' }, error: null })

    const result = await sendCreditPurchaseEmail('freelancer@test.com', 'Bruno Trinchão', 10, 15, 'R$ 29,90')

    expect(result).toEqual({ id: 'send_credit_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Orcei Fácil <contato@orceifacil.com.br>',
        to: 'freelancer@test.com',
        subject: 'Seus créditos foram adicionados!',
        html: expect.stringContaining('Seu saldo já está<br>disponível na conta')
      })
    )
    // Assegura que renderize a tabela de resumo solicitada com as variáveis reais
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('<strong>Créditos adquiridos:</strong> <span style="color: #3147F6; font-weight: bold;">10</span>')
      })
    )
  })

  it('should successfully send proposal email using unified HTML template fallback', async () => {
    const { sendProposalEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({ data: { id: 'send_proposal_id_123' }, error: null })

    const result = await sendProposalEmail(
      'cliente@empresa.com',
      'Cliente João',
      'https://orceifacil.com.br/orcamento/prop_123',
      'Bruno Designer'
    )

    expect(result).toEqual({ id: 'send_proposal_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Orcei Fácil <contato@orceifacil.com.br>',
        to: 'cliente@empresa.com',
        subject: 'Bruno Designer preparou um orçamento para você',
        html: expect.stringContaining('Seu orçamento exclusivo<br>está pronto')
      })
    )
  })

  it('should successfully send using custom Resend templates if configured in runtimeConfig', async () => {
    const { sendWelcomeEmail } = await import('../server/utils/email')
    
    // Altera o runtimeConfig reativo para simular configuração customizada do .env
    const config = useRuntimeConfig()
    config.resendTemplateWelcome = 'tpl_custom_welcome_uuid_123'
    
    mockSend.mockResolvedValue({ data: { id: 'send_custom_tpl_id_123' }, error: null })

    const result = await sendWelcomeEmail('freelancer@test.com', 'Bruno Trinchão')

    expect(result).toEqual({ id: 'send_custom_tpl_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'freelancer@test.com',
        template: expect.objectContaining({
          id: 'tpl_custom_welcome_uuid_123',
          variables: expect.objectContaining({
            userName: 'Bruno Trinchão'
          })
        })
      })
    )
  })

  it('should reroute emails to RESEND_TEST_TO when sandbox routing is configured', async () => {
    const { sendWelcomeEmail } = await import('../server/utils/email')
    process.env.RESEND_TEST_TO = 'sandbox_test@test.com'
    mockSend.mockResolvedValue({ data: { id: 'send_welcome_id_456' }, error: null })

    const result = await sendWelcomeEmail('real_user@test.com', 'User Real')

    expect(result).toEqual({ id: 'send_welcome_id_456' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'sandbox_test@test.com' // Rerouted!
      })
    )
  })

  it('should return null and console.error if Resend API returns an error', async () => {
    const { sendWelcomeEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({
      data: null,
      error: { message: 'Template not found', name: 'ValidationError' }
    })

    const spyError = vi.spyOn(console, 'error')
    const result = await sendWelcomeEmail('real_user@test.com', 'User Real')

    expect(result).toBeNull()
    expect(spyError).toHaveBeenCalledWith(
      expect.stringContaining('[Resend] Welcome Email Error:'),
      expect.any(String)
    )
  })
})
