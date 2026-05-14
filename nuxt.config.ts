// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', '@nuxtjs/tailwindcss', '@vueuse/nuxt', '@nuxtjs/cloudinary'],
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_NAME
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  future: {
    compatibilityVersion: 4
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
      ]
    }
  },

  typescript: {
    strict: true
  },

  runtimeConfig: {
    googleClientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
    geminiApiKey: process.env.GEMINI_API_KEY,
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    stripeStarterPriceId: process.env.STRIPE_STARTER_PRICE_ID,
    stripePremiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
    stripeCredits5PriceId: process.env.STRIPE_CREDITS_5_PRICE_ID,
    stripeCredits10PriceId: process.env.STRIPE_CREDITS_10_PRICE_ID,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudinaryName: process.env.CLOUDINARY_NAME,
  },

  compatibilityDate: '2024-04-03',
  devtools: { enabled: true }
})
