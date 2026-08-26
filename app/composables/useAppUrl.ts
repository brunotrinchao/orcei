export function useAppUrl() {
  const config = useRuntimeConfig()
  const requestUrl = useRequestURL()

  const getAppUrl = (path: string = '/auth/login') => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    const hostname = requestUrl.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return cleanPath
    }

    const base = config.public.appUrl || 'https://app.orceifacil.com.br'
    return `${base}${cleanPath}`
  }

  const isExternalUrl = () => {
    const hostname = requestUrl.hostname
    return hostname !== 'localhost' && hostname !== '127.0.0.1'
  }

  return {
    getAppUrl,
    isExternalUrl
  }
}
