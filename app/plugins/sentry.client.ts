import * as Sentry from '@sentry/browser'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const dsn = config.public.sentryDsn

  if (!dsn) return

  Sentry.init({
    dsn,
    environment: config.public.appEnv,
    dataCollection: {
      // Para desabilitar envio de dados de usuário e corpo de requisições HTTP, descomente abaixo:
      // https://docs.sentry.io/platforms/javascript/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: []
    }
  })

  const vueApp = nuxtApp.vueApp
  const previousErrorHandler = vueApp.config.errorHandler

  vueApp.config.errorHandler = (error, instance, info) => {
    Sentry.captureException(error, {
      extra: { info }
    })
    if (previousErrorHandler) {
      previousErrorHandler(error, instance, info)
    }
  }

  nuxtApp.hook('app:error', (error) => {
    Sentry.captureException(error)
  })

  nuxtApp.hook('vue:error', (error) => {
    Sentry.captureException(error)
  })
})
