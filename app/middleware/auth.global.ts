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

  const privateRoutes = ['/dashboard', '/clientes', '/catalogo', '/orcamentos', '/agenda', '/relatorios', '/planos', '/configuracoes', '/onboarding']
  const isPrivateRoute = privateRoutes.some(route => to.path === route || to.path.startsWith(route + '/'))

  // Se não estiver logado e tentar acessar uma rota privada ou admin, manda pro login
  if (!loggedIn.value && (isPrivateRoute || to.path.startsWith('/admin'))) {
    return navigateTo('/auth/login')
  }

  // Se já estiver logado:
  if (loggedIn.value) {
    // Redireciona de auth/login para dashboard se logado
    if (to.path.startsWith('/auth')) {
      return navigateTo('/dashboard')
    }

    // Proteção de rotas admin
    if (to.path.startsWith('/admin') && user.value?.role !== 'admin') {
      return navigateTo('/dashboard')
    }

    // Verificação obrigatória do Wizard de Onboarding:
    // Busca os dados do perfil (ou usa o cache do Nuxt)
    const { data: profile } = useNuxtData<any>('profile')
    let userProfile = profile.value

    if (!userProfile && import.meta.client) {
      try {
        userProfile = await $fetch('/api/profile')
      } catch (e) {}
    }

    const isWizardCompleted = !!userProfile?.setupWizardCompleted

    // Se o wizard NÃO foi concluído e tentar acessar qualquer outra rota:
    if (userProfile && !isWizardCompleted && to.path !== '/onboarding' && !to.path.startsWith('/_')) {
      return navigateTo('/onboarding')
    }

    // Se o wizard JÁ FOI concluído e tentar acessar /onboarding:
    if (userProfile && isWizardCompleted && to.path === '/onboarding') {
      return navigateTo('/dashboard')
    }
  }
})
