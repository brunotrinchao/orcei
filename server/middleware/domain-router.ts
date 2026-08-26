import { defineEventHandler, getHeader, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const path = event.path || '/'

  // Ignorar todas as chamadas de API, assets do Nuxt, favicon e arquivos estáticos
  // Isso garante que todos os Webhooks (Stripe, QStash, Assinafy, Resend) continuem funcionando 100%
  // independente de serem chamados em orceifacil.com.br ou app.orceifacil.com.br
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_nuxt') ||
    path.startsWith('/_vercel') ||
    path.startsWith('/images/') ||
    path === '/favicon.ico' ||
    path === '/site.webmanifest' ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.svg') ||
    path.endsWith('.ico') ||
    path.endsWith('.css') ||
    path.endsWith('.js')
  ) {
    return
  }

  const rawHost = getHeader(event, 'host') || ''
  const host = rawHost.split(':')[0].toLowerCase().replace(/^www\./, '')

  // Ignorar desenvolvimento local (localhost) e URLs temporárias de preview da Vercel
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')) {
    return
  }

  const config = useRuntimeConfig()
  const apexHost = 'orceifacil.com.br'
  const appHost = 'app.orceifacil.com.br'
  const proposalHost = 'orcamento.orceifacil.com.br'

  // Rotas de aplicação que pertencem ao app.orceifacil.com.br
  const isAppRoute =
    path.startsWith('/dashboard') ||
    path.startsWith('/orcamentos') ||
    path.startsWith('/clientes') ||
    path.startsWith('/catalogo') ||
    path.startsWith('/configuracoes') ||
    path.startsWith('/relatorios') ||
    path.startsWith('/agenda') ||
    path.startsWith('/planos') ||
    path.startsWith('/admin') ||
    path.startsWith('/onboarding') ||
    path.startsWith('/auth/') ||
    path === '/login'

  const isProposalRoute = path.startsWith('/p/')

  // 1. REGRAS PARA DOMÍNIO APEX (orceifacil.com.br)
  if (host === apexHost) {
    if (isAppRoute) {
      const targetPath = path === '/login' ? '/auth/login' : path
      return sendRedirect(event, `https://${appHost}${targetPath}`, 302)
    }
    if (isProposalRoute) {
      return sendRedirect(event, `https://${proposalHost}${path}`, 302)
    }
    // Raiz (/), /terms e /privacy continuam na Landing Page
    return
  }

  // 2. REGRAS PARA SUBDOMÍNIO DA APLICAÇÃO (app.orceifacil.com.br)
  if (host === appHost) {
    if (path === '/') {
      return sendRedirect(event, `https://${appHost}/dashboard`, 302)
    }
    if (isProposalRoute) {
      return sendRedirect(event, `https://${proposalHost}${path}`, 302)
    }
    return
  }

  // 3. REGRAS PARA SUBDOMÍNIO DE ORÇAMENTOS (orcamento.orceifacil.com.br)
  if (host === proposalHost) {
    if (!isProposalRoute) {
      return sendRedirect(event, `https://${apexHost}${path}`, 302)
    }
    return
  }
})
