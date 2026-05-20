import { useStripe } from '../../utils/stripe'
import { SubscriptionPlan } from '../../../types/enums'

export default defineEventHandler(async (event) => {
  const stripe = useStripe()
  
  try {
    // Fetch active recurring prices and expand the associated product
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
      type: 'recurring'
    })

    // Filter to ensure only prices with active products are shown
    const activePrices = prices.data.filter(price => {
      const product = price.product as any
      return product && product.active === true
    })

    return activePrices.map(price => {
      const product = price.product as any
      
      // Extract features from metadata keys starting with 'feature_'
      const features = Object.entries(product.metadata || {})
        .filter(([key]) => key.startsWith('feature_') || !['tier', 'highlight'].includes(key))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([_, value]) => value as string)

      const metadataTier = (product.metadata?.tier || '').toLowerCase()
      const productName = (product.name || '').toLowerCase()
      let planType = SubscriptionPlan.FREE

      if (metadataTier.includes('monthly') || productName.includes('mensal') || productName.includes('monthly')) {
        planType = SubscriptionPlan.MONTHLY
      } else if (metadataTier.includes('annual') || productName.includes('anual') || productName.includes('annual')) {
        planType = SubscriptionPlan.ANNUAL
      } else if (metadataTier.includes('credit') || productName.includes('crédito') || productName.includes('credit')) {
        planType = SubscriptionPlan.CREDIT
      }

      return {
        id: price.id,
        name: product.name,
        // Format price to BRL
        price: (price.unit_amount! / 100).toLocaleString('pt-BR', { 
          style: 'currency', 
          currency: price.currency.toUpperCase() 
        }),
        description: product.description,
        features: features.length > 0 ? features : [product.description].filter(Boolean),
        priceId: price.id,
        tier: metadataTier || (planType !== SubscriptionPlan.FREE ? planType : price.id),
        planType: planType,
        highlight: product.metadata?.highlight === 'true'
      }
    }).sort((a, b) => {
      // Sort: monthly first, then annual, then others
      const aTier = a.tier.toLowerCase()
      const bTier = b.tier.toLowerCase()
      
      if (aTier.includes('monthly') && !bTier.includes('monthly')) return -1
      if (!aTier.includes('monthly') && bTier.includes('monthly')) return 1
      if (aTier.includes('annual') && !bTier.includes('annual')) return -1
      if (!aTier.includes('annual') && bTier.includes('annual')) return 1
      return 0
    })
  } catch (error: any) {
    console.error('Stripe Plans Error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar planos do Stripe'
    })
  }
})
