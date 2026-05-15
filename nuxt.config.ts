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

  build: {
    transpile: ['@nuxtjs/cloudinary']
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@nuxtjs/cloudinary',
        'lucide-vue-next',
        'radix-vue',
        'maska'
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
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    cloudinaryName: process.env.CLOUDINARY_NAME,
    appName: process.env.APP_NAME || 'Orcei',
    appEnv: process.env.APP_ENVIRONMENT || 'development',
    public: {
      stripeStarterPriceId: process.env.STRIPE_STARTER_PRICE_ID,
      stripePremiumPriceId: process.env.STRIPE_PREMIUM_PRICE_ID,
      stripePriceMonthly: process.env.STRIPE_PRICE_MONTHLY,
      stripePriceAnnual: process.env.STRIPE_PRICE_ANNUAL,
      stripePriceSingle: process.env.STRIPE_PRICE_SINGLE,
      stripeCredits5PriceId: process.env.STRIPE_CREDITS_5_PRICE_ID,
      stripeCredits10PriceId: process.env.STRIPE_CREDITS_10_PRICE_ID,
    }
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  hooks: {
    'components:extend'(components) {
      const toRemove = ['CldImage', 'CldVideoPlayer', 'CldOgImage', 'CldUploadWidget', 'CldUploadButton']
      toRemove.forEach(name => {
        const index = components.findIndex(c => c.pascalName === name || c.kebabName === name)
        if (index !== -1) components.splice(index, 1)
      })
    }
  },

  compatibilityDate: '2024-04-03',
  devtools: { enabled: true }
})
