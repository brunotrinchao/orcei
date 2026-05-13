import Stripe from 'stripe'

let stripe: Stripe | null = null

export const useStripe = () => {
  if (stripe) return stripe

  const config = useRuntimeConfig()
  const apiKey = config.stripeSecretKey

  if (!apiKey) {
    console.error('STRIPE_SECRET_KEY is missing in runtimeConfig')
    // Return a dummy instance or throw a descriptive error
    // Throwing here is better than a top-level crash during module load
    throw new Error('Stripe API Key is missing. Please check your .env file.')
  }

  stripe = new Stripe(apiKey, {
    apiVersion: '2024-12-18.acacia' as any
  })

  return stripe
}
