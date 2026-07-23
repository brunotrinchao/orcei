export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  if (config.appEnv === 'production') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  return { status: 'ok', message: 'API is working' }
})
