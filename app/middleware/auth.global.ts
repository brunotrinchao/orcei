export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession()
  
  // 1. Verificação de Modo Manutenção (Global)
  // Ignorar check para rota de manutenção, assets e administradores (condições síncronas baratas)
  if (to.path !== '/maintenance' && !to.path.startsWith('/_') && user.value?.role !== 'admin') {
    try {
      const systemStatus = useState<{ data: any; fetchedAt: number } | null>('system-status', () => null)

      // Se a flag já estiver ativa no cache síncrono, redireciona de imediato
      if (systemStatus.value?.data?.maintenanceMode) {
        return navigateTo('/maintenance')
      }

      const now = Date.now()
      const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

      if (!systemStatus.value || now - systemStatus.value.fetchedAt > CACHE_TTL) {
        const data: any = await $fetch('/api/system/status')
        systemStatus.value = { data, fetchedAt: now }
      }

      if (systemStatus.value.data.maintenanceMode) {
        return navigateTo('/maintenance')
      }
    } catch (e) {
      console.error('System status check failed')
    }
  }

  const privateRoutes = ['/dashboard', '/clientes', '/catalogo', '/orcamentos', '/agenda', '/relatorios', '/planos', '/configuracoes']
  const isPrivateRoute = privateRoutes.some(route => to.path === route || to.path.startsWith(route + '/'))

  // Se não estiver logado e tentar acessar uma rota privada ou admin, manda pro login
  if (!loggedIn.value && (isPrivateRoute || to.path.startsWith('/admin'))) {
    return navigateTo('/auth/login')
  }

  // Se já estiver logado e tentar acessar login/register, manda pro dashboard
  if (loggedIn.value && to.path.startsWith('/auth')) {
    return navigateTo('/dashboard')
  }

  // Proteção de rotas admin
  if (to.path.startsWith('/admin') && user.value?.role !== 'admin') {
    return navigateTo('/dashboard')
  }
})
