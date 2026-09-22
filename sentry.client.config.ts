import * as Sentry from '@sentry/nuxt'

const runtimeConfig = useRuntimeConfig()

Sentry.init({
  dsn: runtimeConfig.public.sentry.dsn,
  environment: runtimeConfig.public.appEnv,

  dataCollection: {
    // Para desabilitar envio de dados de usuário e corpo de requisições HTTP, descomente abaixo:
    // https://docs.sentry.io/platforms/javascript/guides/nuxt/configuration/options/#dataCollection
    // userInfo: false,
    // httpBodies: [],
  },

  // Só emite eventos (erros/traces) em produção
  enabled: runtimeConfig.public.appEnv === 'production',

  tracesSampleRate: 1.0
})
