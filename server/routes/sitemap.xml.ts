import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'https://orceifacil.com.br'
  const currentDate = new Date().toISOString().split('T')[0]

  // Lista de rotas públicas indexáveis do seu sistema
  const routes = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/auth/login', changefreq: 'monthly', priority: '0.5' }
  ]

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
  <url>
    <loc>${siteUrl}${route.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('')}
</urlset>`

  event.node.res.setHeader('Content-Type', 'application/xml')
  return sitemapXml
})
