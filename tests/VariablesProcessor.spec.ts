import { describe, it, expect } from 'vitest'
import { processVariables } from '../server/utils/variables'

describe('Variables Processor Utility', () => {
  const mockProfile = {
    name: 'Minha Empresa',
    address: {
      street: 'Rua Teste',
      number: '123',
      neighborhood: 'Centro',
      city: 'Florianópolis',
      state: 'SC',
      zip: '88000-000'
    }
  }

  const mockProposal = {
    client: { name: 'Cliente Feliz' },
    totals: { final: 1500.50 },
    expiresAt: new Date(new Date().getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 dias a partir de agora
    paymentConfig: {
      method: 'cash' as const,
      installments: 1,
      cashDiscount: 10
    }
  }

  it('should replace client and company names', () => {
    const text = 'Olá {{nome_cliente}}, aqui é da {{nome_empresa}}'
    const result = processVariables(text, mockProposal, mockProfile)
    expect(result).toBe('Olá Cliente Feliz, aqui é da Minha Empresa')
  })

  it('should format total value correctly', () => {
    const text = 'Total: {{valor_total}}'
    const result = processVariables(text, mockProposal, mockProfile)
    // Usando contain para evitar problemas com espaços inseparáveis do toLocaleString
    expect(result).toContain('1.500,50')
  })

  it('should calculate validity days correctly', () => {
    const text = 'Válido por {{dias_validade}} dias'
    const result = processVariables(text, mockProposal, mockProfile)
    expect(result).toBe('Válido por 7 dias')
  })

  it('should format payment details for cash', () => {
    const text = 'Pague {{forma_pagamento}}. {{detalhes_pagamento}}'
    const result = processVariables(text, mockProposal, mockProfile)
    expect(result).toBe('Pague À Vista. Desconto de 10% aplicado')
  })

  it('should format payment details for credit card', () => {
    const creditProposal = {
      ...mockProposal,
      paymentConfig: {
        method: 'credit_card' as const,
        installments: 3,
        cashDiscount: 0
      }
    }
    const text = 'Pague {{forma_pagamento}}. {{detalhes_pagamento}}'
    const result = processVariables(text, creditProposal, mockProfile)
    expect(result).toContain('Cartão de Crédito')
    expect(result).toContain('3x')
    expect(result).toContain('500,17') // 1500.5 / 3 = 500.166... rounded to 500,17
  })

  it('should handle missing data gracefully', () => {
    const emptyProfile = { name: 'Empresa' }
    const text = 'Endereço: {{endereco_prestador}}'
    const result = processVariables(text, mockProposal, emptyProfile)
    expect(result).toBe('Endereço: ')
  })
})
