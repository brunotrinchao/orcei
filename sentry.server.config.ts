import * as Sentry from '@sentry/nuxt'

Sentry.init({
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
  environment: process.env.APP_ENVIRONMENT || 'development',

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // Recomendado ajustar em produção.
  tracesSampleRate: 1.0
})
