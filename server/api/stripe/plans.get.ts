import { useStripe } from '../../utils/stripe'
import { SubscriptionPlan } from '../../../types/enums'

export default defineEventHandler(async (event) => {
  try {
    const stripe = useStripe()
    
    // Fetch active prices (both recurring and one-time) and expand the associated product
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    })

    // Filter to ensure only one-time (non-recurring) prices with active products relating to credits are shown
    const activePrices = prices.data.filter(price => {
      const product = price.product as any
      if (!product || product.active !== true) return false
      
      const isOneTime = price.type === 'one_time'
      // const productName = (product.name || '').toLowerCase()
      // const isCredit = product.metadata?.type === 'credits' || 
      //                  product.metadata?.credits ||
      //                  productName.includes('crédito') ||
      //                  productName.includes('credit') ||
      //                  productName.includes('recarga') ||
      //                  productName.includes('avulso') ||
      //                  productName.includes('pacote')
                       
      return isOneTime
    })

    return activePrices.map(price => {
      const product = price.product as any
      
      // Extract features from metadata keys starting with 'feature_'
      const features = Object.entries(product.metadata || {})
        .filter(([key]) => key.startsWith('feature_') || !['tier', 'highlight', 'type', 'credits'].includes(key))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([_, value]) => value as string)

      const metadataTier = (product.metadata?.tier || '').toLowerCase()
      const productName = (product.name || '').toLowerCase()
      let planType = SubscriptionPlan.FREE

      if (metadataTier.includes('monthly') || productName.includes('mensal') || productName.includes('monthly')) {
        planType = SubscriptionPlan.MONTHLY
      } else if (metadataTier.includes('annual') || productName.includes('anual') || productName.includes('annual')) {
        planType = SubscriptionPlan.ANNUAL
      } else if (metadataTier.includes('credit') || productName.includes('crédito') || productName.includes('credit') || productName.includes('avulso')) {
        planType = SubscriptionPlan.CREDIT
      }

      // Compute credit quantity and unit pricing from Stripe configuration
      const isSingle = metadataTier.includes('single') || productName.includes('avulso') || productName.includes('single')
      const isStarter = metadataTier.includes('starter') || productName.includes('starter')
      const isPro = metadataTier.includes('pro') || productName.includes('profissional') || productName.includes('professional')
      const isAgency = metadataTier.includes('agency') || productName.includes('agência') || productName.includes('agency')

      // Tenta obter credits a partir dos metadados ou Regex inteligente do título/descrição
      let credits = parseInt(product.metadata?.credits || product.metadata?.units || price.metadata?.credits || '0')
      if (!credits) {
        const titleMatch = (product.name || '').match(/\d+/)
        const descMatch = (product.description || '').match(/\d+/)
        
        if (titleMatch) {
          credits = parseInt(titleMatch[0])
        } else if (descMatch) {
          credits = parseInt(descMatch[0])
        }
      }

      // Fallback para as volumetrias padrão
      if (!credits) {
        credits = isSingle ? 1 : isStarter ? 10 : isPro ? 30 : isAgency ? 100 : 1
      }

      const priceVal = price.unit_amount! / 100
      let unitPriceText = ''
      let economyPercent = 0
      
      if (credits > 0) {
        const unitVal = priceVal / credits
        unitPriceText = `R$ ${unitVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / crédito`
        
        // Calcula a porcentagem de economia real baseada na âncora de preço avulso (R$ 5,99)
        const avulsoPrice = 5.99
        economyPercent = Math.max(0, Math.round((1 - (unitVal / avulsoPrice)) * 100))
      }

      // Symmetric fallbacks for features if none are present in Stripe product metadata
      const featuresList = [
        `Gere ${credits} Orçamentos ou Relatórios`,
        credits === 1 ? 'Valor avulso sem mensalidades' : `Economia real de ${economyPercent}% por crédito`,
        'Créditos Vitalícios (Nunca expiram)',
        'Contratos e PDFs incluídos',
        'Aceita orçamento digital '
      ]

      return {
        id: price.id,
        name: product.name,
        price: priceVal.toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: price.currency.toUpperCase() 
        }),
        description: product.description || '',
        features: featuresList,
        priceId: price.id,
        tier: metadataTier || (isSingle ? 'single_credit' : isStarter ? 'starter_pack' : isPro ? 'pro_pack' : isAgency ? 'agency_pack' : price.id),
        planType: planType,
        credits: credits,
        unitPrice: unitPriceText,
        highlight: product.metadata?.highlight === 'true' || isPro
      }
    }).sort((a, b) => {
      // Sort: single credit first, then starter, then pro, then agency
      const aCredits = a.credits || 0
      const bCredits = b.credits || 0
      return aCredits - bCredits
    })
  } catch (error: any) {
    console.error('Stripe Plans Error (falling back to local default packs):', error.message || error)
    return []
  }
})
