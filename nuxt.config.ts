// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', '@nuxtjs/tailwindcss'],
  
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
  },

  compatibilityDate: '2024-04-03',
  devtools: { enabled: true }
})
