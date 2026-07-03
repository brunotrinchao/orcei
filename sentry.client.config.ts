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

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // Recomendado ajustar em produção.
  tracesSampleRate: 1.0
})
