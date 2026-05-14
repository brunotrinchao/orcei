interface ProposalData {
  client: { name: string }
  totals: { final: number }
  expiresAt?: Date
  paymentConfig?: {
    method: 'cash' | 'credit_card'
    installments: number
    cashDiscount: number
  }
}

interface ProfileData {
  name: string
  address?: {
    street?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
    zip?: string
  }
}

export function processVariables(text: string, proposal: ProposalData, profile: ProfileData): string {
  if (!text) return ''
  
  const daysValidade = proposal.expiresAt 
    ? Math.ceil((new Date(proposal.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 30

  const providerAddress = profile.address 
    ? `${profile.address.street || ''}, ${profile.address.number || ''} - ${profile.address.neighborhood || ''}, ${profile.address.city || ''}/${profile.address.state || ''} - ${profile.address.zip || ''}`
    : ''

  const paymentMethod = proposal.paymentConfig?.method === 'cash' ? 'À Vista' : 'Cartão de Crédito'
  let paymentDetails = ''
  
  if (proposal.paymentConfig?.method === 'cash') {
    paymentDetails = proposal.paymentConfig.cashDiscount > 0 
      ? `Desconto de ${proposal.paymentConfig.cashDiscount}% aplicado` 
      : 'Pagamento à vista'
  } else if (proposal.paymentConfig?.method === 'credit_card') {
    const installments = proposal.paymentConfig.installments || 1
    const installmentValue = proposal.totals.final / installments
    const formattedValue = installmentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    paymentDetails = installments > 1 
      ? `Parcelado em ${installments}x de ${formattedValue}`
      : `À vista no cartão (${formattedValue})`
  }

  const replacements: Record<string, string> = {
    '{{nome_cliente}}': proposal.client.name,
    '{{nome_empresa}}': profile.name,
    '{{valor_total}}': proposal.totals.final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    '{{dias_validade}}': String(daysValidade > 0 ? daysValidade : 0),
    '{{endereco_prestador}}': providerAddress,
    '{{forma_pagamento}}': paymentMethod,
    '{{detalhes_pagamento}}': paymentDetails
  }

  let processed = text
  for (const [key, value] of Object.entries(replacements)) {
    processed = processed.replace(new RegExp(key, 'g'), value)
  }

  return processed
}
