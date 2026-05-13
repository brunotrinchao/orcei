interface ProposalData {
  client: { name: string }
  totals: { final: number }
  expiresAt?: Date
}

interface ProfileData {
  name: string
}

export function processVariables(text: string, proposal: ProposalData, profile: ProfileData): string {
  if (!text) return ''
  
  const daysValidade = proposal.expiresAt 
    ? Math.ceil((new Date(proposal.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 30

  const replacements: Record<string, string> = {
    '{{nome_cliente}}': proposal.client.name,
    '{{nome_empresa}}': profile.name,
    '{{valor_total}}': proposal.totals.final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    '{{dias_validade}}': String(daysValidade > 0 ? daysValidade : 0)
  }

  let processed = text
  for (const [key, value] of Object.entries(replacements)) {
    processed = processed.replace(new RegExp(key, 'g'), value)
  }

  return processed
}
