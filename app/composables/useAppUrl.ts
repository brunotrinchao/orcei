export function useAppUrl() {
  const config = useRuntimeConfig()

  const getAppUrl = (path: string = '/auth/login') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    if (process.client) {
      const hostname = window.location.hostname
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return cleanPath
      }
    }
    const base = config.public.appUrl || 'https://app.orceifacil.com.br'
    return `${base}${cleanPath}`
  }

  return {
    getAppUrl
  }
}
