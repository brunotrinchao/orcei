export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user } = useUserSession()
  
  // 1. Verificação de Modo Manutenção (Global)
  // Ignorar check para rota de manutenção e assets
  if (to.path !== '/maintenance' && !to.path.startsWith('/_')) {
    try {
      const status: any = await $fetch('/api/system/status')
      if (status.maintenanceMode && user.value?.role !== 'admin') {
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
