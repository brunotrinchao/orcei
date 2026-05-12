// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@sidebase/nuxt-auth'],
  auth: {
    provider: {
      type: 'authjs'
    }
  },
  typescript: {
    strict: true
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
