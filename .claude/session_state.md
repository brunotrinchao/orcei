# Session State — Orcei SEO Studio (2026-09-09)

## Current Objective
Chips de categoria do blog navegam p/ página de categoria (`/blog/categoria/[slug]`), não filtram in-place.

## Files Read
- `/home/brunotrinchao/Documentos/Bruno/OrceiFacil_Blog/pages/index.vue` — feed, featured, chips
- `/home/brunotrinchao/Documentos/Bruno/OrceiFacil_Blog/pages/blog/categoria/[categoria].vue` — página de categoria (param: `categoria`)
- `/home/brunotrinchao/Documentos/Bruno/OrceiFacil_Blog/components/AppHeader.vue` — header, categorias removidas
- `/home/brunotrinchao/Documentos/Bruno/Orcei/app/layouts/landing.vue` — nav mobile (Blog added line 138)

## Decisions Taken
- Chips = NuxtLink p/ `/blog/categoria/${slug}` (categoria page existe)
- Categorias derivadas dos posts (sem hardcode)
- `route` auto-imported (useRoute adicionado no script setup)
- AppHeader: só "Início" no nav (desktop + mobile)

## Next Steps
- Deploy blog: `git add -A && git commit -m "feat: chips categoria navegam p/ pagina categoria" && git push && npx vercel --prod`
- Deploy landing: `git add -A && git commit -m "feat: link blog no menu mobile" && git push`
- Validar produção: `curl -s https://blog.orceifacil.com.br/` + click categoria
- GSC subdomain blog pendente (property + sitemap)

## Fixes Live (earlier)
- Schema JSON-LD innerHTML fix (app), noindex login/terms/privacy/p/[slug], sitemap limpo, llms.txt ambos, ISR 300s, robots blog, better-sqlite3 12.5