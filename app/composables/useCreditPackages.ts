export interface CreditPackage {
  id: string
  name: string
  credits: number
  price: string
  unitPrice: string
  description: string
  features: string[]
  highlight: boolean
  badge: string
}

const FALLBACK_PACKAGES: CreditPackage[] = [
  {
    id: 'single_credit',
    name: 'Crédito Avulso',
    credits: 1,
    price: 'R$ 5,99',
    unitPrice: 'R$ 5,99 / crédito',
    description: 'Ideal para orçar um projeto avulso rápido sem compromisso.',
    features: [
      'Gere 1 Orçamento ou Relatório IA',
      'Valor avulso sem mensalidades',
      'Créditos Vitalícios (Nunca expiram)',
      'Contratos e PDFs incluídos',
      'Aceita orçamento digital '
    ],
    highlight: false,
    badge: 'Consumo Único'
  },
  {
    id: 'starter_pack',
    name: 'Pacote Starter',
    credits: 10,
    price: 'R$ 29,00',
    unitPrice: 'R$ 2,90 / crédito',
    description: 'Para freelancers iniciantes com fluxo regular de propostas.',
    features: [
      'Gere 10 Orçamentos ou Relatórios',
      'Economia real de 51.6% por crédito',
      'Créditos Vitalícios (Nunca expiram)',
      'Contratos e PDFs incluídos',
      'Aceita orçamento digital '
    ],
    highlight: false,
    badge: 'Popular para Iniciantes'
  },
  {
    id: 'pro_pack',
    name: 'Pacote Profissional',
    credits: 30,
    price: 'R$ 69,00',
    unitPrice: 'R$ 2,30 / crédito',
    description: 'Focado em profissionais autônomos ativos com volume comercial constante.',
    features: [
      'Gere 30 Orçamentos ou Relatórios',
      'Economia gigante de 61.6% por crédito',
      'Créditos Vitalícios (Nunca expiram)',
      'Contratos e PDFs incluídos',
      'Aceita orçamento digital '
    ],
    highlight: true,
    badge: 'Melhor Valor'
  },
  {
    id: 'agency_pack',
    name: 'Pacote Agência',
    credits: 100,
    price: 'R$ 149,00',
    unitPrice: 'R$ 1,49 / crédito',
    description: 'Para agências, estúdios ou autônomos com escala de contratações.',
    features: [
      'Gere 100 Orçamentos ou Relatórios',
      'Economia máxima de 75.1% por crédito',
      'Créditos Vitalícios (Nunca expiram)',
      'Contratos e PDFs incluídos',
      'Aceita orçamento digital '
    ],
    highlight: false,
    badge: 'Uso Comercial Elevado'
  }
]

/**
 * Fonte única dos pacotes de crédito, usada em /planos (SaaS) e na landing page.
 * Mesma request (/api/stripe/plans) e mesmas informações; cada tela decide o layout.
 */
export function useCreditPackages() {
  const { data: stripePackages, refresh, pending } = useLazyFetch<any[]>('/api/stripe/plans')

  const packages = computed<CreditPackage[]>(() => {
    const stripeData = stripePackages.value || []

    if (!stripeData.length) {
      return FALLBACK_PACKAGES
    }

    // Mapeia e decora cada produto e preço dinâmico do Stripe
    return stripeData.map(pack => {
      const id = (pack.tier || pack.id || '').toLowerCase()
      const isPro = id.includes('pro') || id.includes('premium') || id.includes('profissional')
      const isStarter = id.includes('starter')
      const isAgency = id.includes('agency') || id.includes('annual') || id.includes('agencia')
      const isSingle = id.includes('single') || id.includes('credit') || id.includes('avulso')

      return {
        id: pack.priceId || pack.id,
        name: pack.name,
        credits: pack.credits || (isSingle ? 1 : isStarter ? 10 : isPro ? 30 : isAgency ? 100 : 1),
        price: pack.price,
        unitPrice: pack.unitPrice || (isSingle ? 'R$ 5,99 / crédito' : isStarter ? 'R$ 2,90 / crédito' : isPro ? 'R$ 2,30 / crédito' : 'R$ 1,49 / crédito'),
        description: pack.description || '',
        features: pack.features || [],
        highlight: pack.highlight ?? isPro,
        badge: isSingle ? 'Consumo Único' : isStarter ? 'Popular para Iniciantes' : isPro ? 'Melhor Valor' : 'Uso Comercial Elevado'
      }
    })
  })

  return { packages, refresh, pending }
}
