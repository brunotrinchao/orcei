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

describe('Email Service Integration (Resend Templates-only)', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 're_mock_api_key_123'
    process.env.RESEND_TEST_TO = '' // Default empty
  })

  it('should successfully send welcome email using Resend template ID (RESEND_TEMPLATE_WELLCOME)', async () => {
    const { sendWelcomeEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({ data: { id: 'send_welcome_id_123' }, error: null })

    const result = await sendWelcomeEmail('freelancer@test.com', 'Bruno Trinchão')

    expect(result).toEqual({ id: 'send_welcome_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Orcei Fácil <contato@orceifacil.com.br>',
        to: 'freelancer@test.com',
        subject: 'Bem-vindo ao Orcei Fácil!',
        template: expect.objectContaining({
          id: 'bem-vindo',
          variables: expect.objectContaining({
            userName: 'Bruno Trinchão',
            appName: 'Orcei Fácil',
            appUrl: 'https://orceifacil.com.br'
          })
        })
      })
    )
  })

  it('should successfully send backup data email using Resend template ID (RESEND_TEMPLATE_BACKUP)', async () => {
    const { sendBackupEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({ data: { id: 'send_backup_id_123' }, error: null })

    const mockBuffer = Buffer.from('mock_zip_content')
    const result = await sendBackupEmail('freelancer@test.com', 'Bruno Trinchão', 'link')

    expect(result).toEqual({ id: 'send_backup_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Orcei Fácil <contato@orceifacil.com.br>',
        to: 'freelancer@test.com',
        subject: 'Seu Backup de Dados - Orcei Fácil',
        template: expect.objectContaining({
          id: 'backup',
          variables: expect.objectContaining({
            userName: 'Bruno Trinchão',
            appName: 'Orcei Fácil'
          })
        }),
      })
    )
  })

  it('should successfully send credit purchase email using Resend template ID (RESEND_TEMPLATE_BUY_CREDIT)', async () => {
    const { sendCreditPurchaseEmail } = await import('../server/utils/email')
    mockSend.mockResolvedValue({ data: { id: 'send_credit_id_123' }, error: null })

    const result = await sendCreditPurchaseEmail('freelancer@test.com', 'Bruno Trinchão', 10, 15, 'R$ 29,90')

    expect(result).toEqual({ id: 'send_credit_id_123' })
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Orcei Fácil <contato@orceifacil.com.br>',
        to: 'freelancer@test.com',
        subject: 'Seus créditos foram adicionados!',
        template: expect.objectContaining({
          id: 'comprar-credito',
          variables: expect.objectContaining({
            userName: 'Bruno Trinchão',
            creditsAdded: '10',
            newBalance: '15',
            amountPaid: 'R$ 29,90'
          })
        })
      })
    )
  })

  it('should successfully send proposal email using Resend template ID (RESEND_TEMPLATE_PROPOSAL)', async () => {
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
        template: expect.objectContaining({
          id: 'proposta',
          variables: expect.objectContaining({
            clientName: 'Cliente João',
            professionalName: 'Bruno Designer',
            proposalUrl: 'https://orceifacil.com.br/orcamento/prop_123'
          })
        })
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
