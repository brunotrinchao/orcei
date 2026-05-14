export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  
  // Se não estiver logado e tentar acessar dashboard, manda pro login
  if (!loggedIn.value && to.path.startsWith('/dashboard')) {
    return navigateTo('/auth/login')
  }

  // Se já estiver logado e tentar acessar login/register, manda pro dashboard
  if (loggedIn.value && to.path.startsWith('/auth')) {
    return navigateTo('/dashboard')
  }
})
