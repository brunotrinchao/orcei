# Orcei — Documentação de Arquitetura

## 1. Visão Geral

Orcei é um SaaS B2B para geração e gestão de propostas comerciais voltado a freelancers e pequenas empresas. O profissional cadastra seus produtos/serviços em um catálogo, monta propostas personalizadas com contrato e termos, e envia um link único ao cliente. O cliente acessa a proposta via URL pública, pode escolher forma de pagamento, solicitar alterações ou aceitar — sem precisar de cadastro.

**Fluxo básico:**
1. Profissional faz login via Google OAuth
2. Cria/edita proposta (itens do catálogo ou avulsos)
3. Publica a proposta (consome 1 crédito) — email automático enviado ao cliente
4. Cliente acessa `/p/:slug?t=:token`, revisa e aceita/recusa
5. Proposta transita entre estados: `draft → created → pending → accepted | expired`
6. Créditos são gerenciados via planos Stripe (free/starter/premium)

---

## 2. Stack

| Camada | Tecnologia | Versão/Detalhe |
|--------|-----------|----------------|
| Framework | Nuxt 4 (compatibility mode) | `compatibilityVersion: 4` |
| Frontend | Vue 3 + Composition API | SPA dentro do Nuxt |
| Estilo | Tailwind CSS | `@nuxtjs/tailwindcss` |
| UI Components | Radix Vue + componentes próprios com prefixo `Base*` | — |
| Rich Text | TipTap (vue-3) | `@tiptap/starter-kit`, underline, link |
| Calendário | FullCalendar | `@fullcalendar/vue3` |
| Máscaras | Maska | `maska` |
| Estado Global | `useState` do Nuxt (SSR-safe) | sem Pinia |
| Backend | Nuxt Server (H3) | rotas em `server/api/` |
| Banco de Dados | MongoDB via Mongoose | `mongoose` |
| Autenticação | nuxt-auth-utils (Google OAuth) | sessão em cookie signed |
| Pagamentos | Stripe | Checkout Sessions + Customer Portal + Webhooks |
| Upload | Cloudinary | `@nuxtjs/cloudinary` |
| Email | Resend (REST direto) | transacional |
| AI | Google Gemini | `@google/generative-ai` via `geminiApiKey` |
| PDF | Puppeteer + Chromium | `generateProposalHtml()` → PDF |
| CEP | ViaCEP | `$fetch` direto no client |
| Linguagem | TypeScript | `strict: true` |
| Testes | Vitest | `vitest.config.ts` |

---

## 3. Arquitetura de Camadas

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                             │
│   Vue 3 Pages + Components (app/pages/, app/components/) │
│   Composables (useAlerts, useUserSession, useFetch...)   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / fetch
┌────────────────────────▼────────────────────────────────┐
│              Nuxt Server (H3)                            │
│   server/api/**/*.ts  (rotas REST + webhook)             │
│   Middleware global: auth.global.ts                      │
│   Plugins: stripe.ts (useStripe composable)              │
└────────────────────────┬────────────────────────────────┘
                         │ import direto
┌────────────────────────▼────────────────────────────────┐
│              Services                                    │
│   ProposalService   ProfileService                       │
│   (lógica de negócio, orquestração)                      │
└────────────────────────┬────────────────────────────────┘
                         │ Mongoose
┌────────────────────────▼────────────────────────────────┐
│              Models (Mongoose Schemas)                   │
│   Profile  Proposal  Client  CatalogItem                 │
│   Event    Counter   StripeEvent                         │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              MongoDB Atlas (ou local)                    │
└─────────────────────────────────────────────────────────┘

Integrações externas (chamadas a partir de server/):
  Stripe API ◄─── server/api/stripe/ + server/api/webhooks/stripe.post.ts
  Resend API ◄─── server/utils/email.ts
  Cloudinary ◄─── server/api/upload/cloudinary.post.ts
  Gemini AI  ◄─── server/api/ai/
  Puppeteer  ◄─── server/utils/pdf.ts + server/api/proposals/[id]/pdf.get.ts
  ViaCEP     ◄─── chamado diretamente do browser (app/)
```

---

## 4. Estrutura de Diretórios

```
Orcei/
├── app/                        # Código frontend (Nuxt 4 convention)
│   ├── components/             # Componentes Vue reutilizáveis (prefixo Base*)
│   │   └── ui/                 # Primitivas: BaseInput, BaseButton, etc.
│   ├── composables/            # Lógica reutilizável (prefixo use*)
│   │   └── useAlerts.ts        # Sistema de alertas/modais global via useState
│   ├── layouts/                # Layouts Nuxt (default.vue com navbar/sidebar)
│   ├── middleware/
│   │   └── auth.global.ts      # Guard global: protege /dashboard/*, redireciona /auth/*
│   ├── pages/                  # Rotas automáticas do Nuxt
│   │   ├── dashboard/          # Área autenticada (index, propostas, clientes, etc.)
│   │   ├── p/[slug].vue        # Visualização pública da proposta
│   │   └── auth/login.vue      # Página de login (só Google)
│   └── plugins/
│       └── maska.ts            # Registro global da diretiva v-maska
├── server/
│   ├── api/                    # Rotas H3 (convenção: método no sufixo do arquivo)
│   │   ├── auth/               # google.get.ts, logout.post.ts
│   │   ├── proposals/          # CRUD + /public/:slug + /[id]/pdf + /[id]/resend
│   │   ├── clients/            # CRUD
│   │   ├── catalog/            # CRUD
│   │   ├── events/             # CRUD (agenda/calendário)
│   │   ├── profile/            # get/put do perfil autenticado
│   │   ├── dashboard/stats.get.ts  # Métricas do dashboard
│   │   ├── ai/                 # generate.post.ts (Gemini), analyze.get.ts
│   │   ├── stripe/             # checkout.post, portal.post, invoices.get, manage.post
│   │   ├── upload/             # cloudinary.post.ts
│   │   └── webhooks/
│   │       └── stripe.post.ts  # Webhook Stripe com idempotência
│   ├── models/                 # Schemas Mongoose
│   ├── services/               # Lógica de negócio
│   │   ├── ProposalService.ts  # Criação, status, créditos, email
│   │   └── ProfileService.ts   # Criação de perfil + Stripe customer
│   └── utils/
│       ├── email.ts            # sendProposalEmail via Resend REST
│       ├── pdf.ts              # generateProposalHtml (template HTML)
│       ├── stripe.ts           # useStripe() — singleton Stripe client
│       └── variables.ts        # processVariables() — interpolação {{var}} no contrato
├── scripts/
│   └── backfill-stripe-subscription-state.ts  # Script one-shot pós-deploy
├── tests/                      # Vitest (atualmente: Billing.spec.ts)
├── nuxt.config.ts              # Configuração central: módulos, runtimeConfig, vite
├── vitest.config.ts
└── package.json
```

---

## 5. Fluxos Críticos

### 5.1 Login (Google OAuth)

1. Usuário clica em "Entrar com Google" → redireciona para `/auth/google`
2. `nuxt-auth-utils` inicia o fluxo OAuth com `NUXT_OAUTH_GOOGLE_CLIENT_ID`
3. Google redireciona de volta para `/auth/google` com code
4. `server/api/auth/google.get.ts` recebe o callback via `defineOAuthGoogleEventHandler`
5. `ProfileService.createForUser({ id, name, email })` é chamado:
   - Se perfil já existe (por `userId`), retorna existente
   - Se novo: cria Customer no Stripe (`stripe.customers.create`) e salva Profile com `creditsBalance: 1, subscriptionPlan: 'free'`
6. `setUserSession(event, { user: { id, name, email } })` grava cookie de sessão assinado
7. Redireciona para `/dashboard`
8. Middleware `auth.global.ts` bloqueia `/dashboard/*` se `!loggedIn.value`

### 5.2 Criação de Proposta

1. Frontend (`POST /api/proposals`) envia corpo com `{ profileId, title, client, items, status, sendMethod, ... }`
2. `server/api/proposals/index.post.ts` chama `ProposalService.create(data)`
3. **Counter sequencial**: `Counter.findOneAndUpdate({ profileId, year }, { $inc: { lastSequence: 1 } }, { upsert: true })` — gera `code = #ORC-{ano}-{seq padded 3}`
4. **Slug + token**: `nanoid(10)` para slug público único, `nanoid(20)` para token de validação
5. **Validade**: busca `profile.defaultValidityDays` (padrão 7), calcula `expiresAt`
6. **Consumo de crédito** (se `status === 'created'`):
   - `Profile.creditsUsed >= Profile.creditsBalance` → lança 403
   - `Profile.findByIdAndUpdate(profileId, { $inc: { creditsUsed: 1 } })`
7. **Envio de email** (se `sendMethod !== 'manual'` e `client.email` existe):
   - URL: `{PUBLIC_URL}/p/{slug}?t={token}`
   - `sendProposalEmail()` → POST na API Resend, armazena `lastEmailId`
8. `Proposal.create({ ...data, slug, token, sequenceNumber, code, totals, expiresAt })`

### 5.3 Visualização Pública de Proposta

1. Cliente acessa `/p/:slug?t=:token`
2. `app/pages/p/[slug].vue` faz `GET /api/proposals/public/:slug`
3. `server/api/proposals/public/[slug].get.ts` chama `ProposalService.getBySlug(slug)` → `Proposal.findOne({ slug }).populate('profileId')`
4. Frontend valida token: compara `proposal.token === query.t`; se inválido, exibe estado de erro
5. Estados renderizados: `draft` (não visível publicamente), `created`/`pending` (interativo), `accepted` (somente leitura), `expired` (banner de expirada)
6. Ações do cliente via `POST /api/proposals/public/action`:
   - **Aceitar**: `ProposalService.acceptProposal(slug, paymentMethod)` → status `accepted`
   - **Recusar**: `ProposalService.declineProposal(slug)` → status `expired`
   - **Solicitar alterações**: `ProposalService.requestChanges(slug)` → status `pending`

### 5.4 Checkout Stripe

1. Frontend (`POST /api/stripe/checkout`) envia `{ tier, type }`
   - `type = 'subscription'`: tiers `starter`, `premium`, `premium_monthly`, `premium_annual`
   - `type = 'credits'` (payment): tiers `single_credit`, `credits_5`, `credits_10`
2. `server/api/stripe/checkout.post.ts`:
   - Valida sessão, busca Profile por `userId`
   - Mapeia `tier` → `priceId` via `config.public.stripe*PriceId`
   - `stripe.checkout.sessions.create({ customer: profile.stripeCustomerId, mode, metadata: { userId, profileId, type, tier } })`
   - Retorna `{ url }` → frontend redireciona para Stripe Checkout
3. Após pagamento, Stripe POST para `POST /api/webhooks/stripe`
4. Webhook `checkout.session.completed`:
   - Se subscription: `stripe.subscriptions.retrieve(subscriptionId)` → mapeia priceId → plano → define `creditsBalance` (starter=5, premium=9999)
   - `Profile.findOneAndUpdate` com `subscriptionPlan`, `creditsBalance`, `stripeSubscriptionId`, `subscriptionEndsAt`
5. Webhook `invoice.payment_succeeded`: renovação mensal/anual — reseta `creditsBalance` para o valor do plano

### 5.5 Cancelamento de Assinatura

1. Frontend (`POST /api/stripe/portal`) solicita sessão do Customer Portal
2. `server/api/stripe/portal.post.ts`: `stripe.billingPortal.sessions.create({ customer: profile.stripeCustomerId, return_url })` → retorna URL
3. Usuário cancela no portal Stripe (UI externa)
4. Stripe dispara `customer.subscription.updated` com `cancel_at_period_end: true`
5. Webhook atualiza Profile: `cancelAtPeriodEnd: true`, `subscriptionEndsAt: <data_fim_período>` — `subscriptionPlan` não muda ainda
6. Frontend exibe banner "sua assinatura será cancelada em {data}" com base em `cancelAtPeriodEnd + subscriptionEndsAt`
7. Ao fim do período, Stripe dispara `customer.subscription.deleted`
8. Webhook define: `subscriptionPlan: 'free'`, `subscriptionStatus: 'canceled'`, `cancelAtPeriodEnd: false`, zera `stripeSubscriptionId`

### 5.6 Geração de PDF

1. `GET /api/proposals/:id/pdf` (autenticado) ou `GET /api/proposals/public/:slug/pdf` (público com token)
2. Busca proposta + profile no MongoDB
3. `server/utils/pdf.ts → generateProposalHtml(proposal, profile)`:
   - `processVariables()` interpola `{{nome_empresa}}`, `{{nome_cliente}}`, `{{dias_validade}}` no contractText e termsAndConditions
   - Gera HTML completo com estilos inline, tabela de itens, totais, contrato e termos (page-break entre páginas)
4. Puppeteer abre o HTML em Chromium headless com `--no-sandbox` (necessário em ambientes cloud)
5. `page.pdf({ format: 'A4', printBackground: true })` gera o Buffer
6. Response com `Content-Type: application/pdf` e `Content-Disposition: attachment`

---

## 6. Modelos de Dados

### Profile
Collection `profiles`. Um por usuário Google.

| Campo | Tipo | Papel |
|-------|------|-------|
| `userId` | String (unique) | ID do Google (`user.sub`) |
| `name`, `email` | String | Dados do profissional |
| `brandConfig.logoUrl` | String | URL Cloudinary do logo |
| `brandConfig.primaryColor` | String | Cor hex para PDFs/templates |
| `company.taxId/legalName/tradeName` | String | Dados fiscais do profissional |
| `address` | Object | Endereço completo |
| `contact.phones`, `contact.social` | Array/Object | Telefones e redes sociais |
| `creditsBalance` | Number | Créditos disponíveis (free=1, starter=5, premium=9999) |
| `creditsUsed` | Number | Créditos consumidos (propostas publicadas) |
| `subscriptionPlan` | 'free'\|'starter'\|'premium' | **Fonte de verdade** para feature gating |
| `subscriptionStatus` | String | Espelho do status Stripe (para UI informativa) |
| `stripeCustomerId` | String | ID do customer no Stripe |
| `stripeSubscriptionId` | String | ID da subscription ativa |
| `stripePriceId` | String | Price ID ativo (para mapear plano em webhooks) |
| `subscriptionEndsAt` | Date | Data de término do período atual |
| `cancelAtPeriodEnd` | Boolean | True quando cancelamento agendado |
| `defaultValidityDays` | Number | Validade padrão de novas propostas (padrão: 7) |
| `defaultContractTemplate` | String (HTML) | Template de contrato com variáveis `{{...}}` |
| `defaultTermsAndConditions` | String (HTML) | T&C padrão pré-preenchido |

### Proposal
Collection `proposals`. Status workflow: `draft → created → pending → accepted | expired`

| Campo | Tipo | Papel |
|-------|------|-------|
| `profileId` | ObjectId → Profile | Dono da proposta |
| `title` | String | Título da proposta |
| `code` | String | Ex: `#ORC-2025-001` (legível) |
| `sequenceNumber` | Number | Número sequencial por profissional/ano |
| `slug` | String (unique) | ID público URL-safe (`nanoid(10)`) |
| `token` | String | Token de validação no link (`nanoid(20)`) |
| `status` | Enum | `draft\|created\|pending\|accepted\|expired` |
| `client` | Object | Snapshot de nome/email/phone no momento da criação |
| `items` | Array\<itemSnapshot\> | Snapshot dos itens (name, description, price, quantity, discount) |
| `upsellItems` | Array\<itemSnapshot\> | Itens de upsell opcionais |
| `totals` | Object | `{ subtotal, additional, discount, final }` calculado server-side |
| `paymentConfig` | Object | `{ method: cash\|credit_card, installments, cashDiscount% }` |
| `sendMethod` | 'manual'\|'auto' | Se auto, envia email ao publicar |
| `contractText` | String (HTML) | Texto do contrato (com variáveis) |
| `termsAndConditions` | String (HTML) | Termos e condições |
| `expiresAt` | Date | Data de expiração |
| `lastEmailId` | String | ID do email Resend enviado (para debug) |

### Client
Collection `clients`. Agenda de clientes do profissional.

| Campo | Tipo | Papel |
|-------|------|-------|
| `profileId` | ObjectId → Profile | Dono do cliente |
| `name`, `email`, `phone` | String | Contato |
| `taxId` | String | CPF/CNPJ (opcional) |
| `isWhatsapp` | Boolean | Se o phone é WhatsApp |
| `address` | Object | Endereço completo |
| `notes` | String | Observações livres |
| Índice | `{ profileId, email }` | Evita duplicatas por perfil |

### CatalogItem
Collection `catalogitems`. Catálogo de produtos/serviços do profissional.

| Campo | Tipo | Papel |
|-------|------|-------|
| `profileId` | ObjectId → Profile | Dono do item |
| `type` | 'product'\|'service' | Categoria |
| `name`, `description` | String | Descrição do item |
| `price` | Number | Preço unitário |
| `unit` | String | Unidade: UN, KG, CM, ML, H, DIA, MES |
| `sku` | String | Código interno (opcional) |
| `imageUrl` | String | URL Cloudinary |

### Event
Collection `events`. Agenda/calendário do profissional.

| Campo | Tipo | Papel |
|-------|------|-------|
| `profileId` | ObjectId → Profile | Dono do evento |
| `proposalId` | ObjectId → Proposal | Vinculação opcional a uma proposta |
| `title`, `description` | String | Dados do evento |
| `start`, `end` | Date | Intervalo do evento |
| `allDay` | Boolean | Se é evento de dia inteiro |
| `color` | String | Cor hex para exibição no calendário |

### Counter
Collection `counters`. Controle de numeração sequencial por profissional/ano.

| Campo | Tipo | Papel |
|-------|------|-------|
| `profileId` | ObjectId → Profile | Contexto do profissional |
| `year` | Number | Ano de referência |
| `lastSequence` | Number | Último número usado (incrementado atomicamente via `$inc`) |
| Índice | `{ profileId, year }` (unique) | Garante um counter por profissional por ano |

### StripeEvent
Collection `stripeevents`. Idempotência de webhooks.

| Campo | Tipo | Papel |
|-------|------|-------|
| `eventId` | String (unique) | ID do evento Stripe (`evt_*`) |
| `type` | String | Tipo do evento (ex: `checkout.session.completed`) |
| TTL | 30 dias (índice TTL) | Expiração automática dos registros |

---

## 7. Integrações Externas

### Google OAuth
- **Propósito**: autenticação única (sem senha local)
- **Fluxo**: `nuxt-auth-utils` gerencia o redirect OAuth e callback em `server/api/auth/google.get.ts`
- **Env**: `NUXT_OAUTH_GOOGLE_CLIENT_ID`, `NUXT_OAUTH_GOOGLE_CLIENT_SECRET`

### Stripe
- **Propósito**: subscriptions (starter/premium), add-on de créditos avulsos, Customer Portal
- **Fluxo**:
  - Checkout: `POST /api/stripe/checkout` → Stripe Checkout Session → redirect → webhook
  - Portal: `POST /api/stripe/portal` → Customer Portal session URL → redirect
  - Webhooks: `POST /api/webhooks/stripe` processa `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.created`, `invoice.payment_succeeded`, `customer.subscription.deleted`
  - Idempotência: `StripeEvent` com índice unique em `eventId` — duplicata retorna 200 sem reprocessar
- **Env**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, todos os `STRIPE_*_PRICE_ID` (ver seção 8)

### Cloudinary
- **Propósito**: upload e hospedagem de imagens (logo do profissional, imagens de catalog items)
- **Fluxo**: `POST /api/upload/cloudinary` assina o upload server-side; módulo `@nuxtjs/cloudinary` no frontend
- **Env**: `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Google Gemini AI
- **Propósito**: geração de conteúdo para propostas (sugestão de descrições, títulos)
- **Fluxo**: `POST /api/ai/generate` e `GET /api/ai/analyze` chamam a API Gemini com `geminiApiKey`
- **Env**: `GEMINI_API_KEY`

### Puppeteer/Chromium (PDF)
- **Propósito**: geração de PDF das propostas
- **Fluxo**: `generateProposalHtml()` → Puppeteer lança Chromium headless, renderiza HTML, exporta PDF
- **Env**: nenhuma variável específica; requer Chromium instalado no servidor (`--no-sandbox` obrigatório em produção)

### Resend (Email transacional)
- **Propósito**: envio do link da proposta ao cliente final
- **Fluxo**: `server/utils/email.ts` faz POST direto na API REST do Resend (`https://api.resend.com/emails`)
- **Remetente atual**: `onboarding@resend.dev` (domínio de teste — não entrega em produção; ver roadmap)
- **Env**: `RESEND_API_KEY`

### ViaCEP (busca de endereço por CEP)
- **Propósito**: preenchimento automático de endereço ao digitar CEP
- **Fluxo**: chamada direta do browser para `https://viacep.com.br/ws/{cep}/json/`
- **Env**: nenhuma (API pública)

---

## 8. Variáveis de Ambiente

| Variável | Obrigatória | Origem | Propósito |
|----------|-------------|--------|-----------|
| `NUXT_OAUTH_GOOGLE_CLIENT_ID` | Sim | Google Cloud Console | Client ID OAuth |
| `NUXT_OAUTH_GOOGLE_CLIENT_SECRET` | Sim | Google Cloud Console | Client Secret OAuth |
| `NUXT_SESSION_PASSWORD` | Sim | Gerada localmente (32+ chars) | Assinar cookie de sessão (nuxt-auth-utils) |
| `MONGODB_URI` | Sim | MongoDB Atlas / local | String de conexão MongoDB |
| `STRIPE_SECRET_KEY` | Sim | Stripe Dashboard | Chamadas server-side à API Stripe |
| `STRIPE_WEBHOOK_SECRET` | Sim | Stripe CLI / Dashboard | Verificação de assinatura de webhooks |
| `STRIPE_STARTER_PRICE_ID` | Sim | Stripe Dashboard | Price ID do plano Starter (subscription) |
| `STRIPE_PREMIUM_PRICE_ID` | Sim | Stripe Dashboard | Price ID do plano Premium (subscription) |
| `STRIPE_PRICE_MONTHLY` | Sim | Stripe Dashboard | Price ID Premium mensal (alias) |
| `STRIPE_PRICE_ANNUAL` | Sim | Stripe Dashboard | Price ID Premium anual |
| `STRIPE_PRICE_SINGLE` | Sim | Stripe Dashboard | Price ID de 1 crédito avulso (payment) |
| `STRIPE_CREDITS_5_PRICE_ID` | Sim | Stripe Dashboard | Price ID de 5 créditos avulsos |
| `STRIPE_CREDITS_10_PRICE_ID` | Sim | Stripe Dashboard | Price ID de 10 créditos avulsos |
| `RESEND_API_KEY` | Sim | Resend Dashboard | Envio de emails transacionais |
| `CLOUDINARY_NAME` | Sim | Cloudinary Dashboard | Cloud name para uploads |
| `CLOUDINARY_API_KEY` | Sim | Cloudinary Dashboard | API Key para assinar uploads |
| `CLOUDINARY_API_SECRET` | Sim | Cloudinary Dashboard | API Secret para assinar uploads |
| `GEMINI_API_KEY` | Sim | Google AI Studio | Chamadas à API Gemini |
| `PUBLIC_URL` | Não | Deploy | URL base para links de proposta (default: `https://orcei.com.br`) |
| `NUXT_PUBLIC_SITE_URL` | Não | Deploy | URL base para redirect Stripe (default: `http://localhost:3000`) |
| `APP_NAME` | Não | Deploy | Nome do app (default: `Orcei`) |
| `APP_ENVIRONMENT` | Não | Deploy | `development` ou `production` |

---

## 9. Autenticação e Autorização

- **Método**: Google OAuth 2.0 via `nuxt-auth-utils`
- **Sessão**: cookie HTTP-only assinado com `NUXT_SESSION_PASSWORD`; dados: `{ user: { id, name, email } }`
- **Composable**: `useUserSession()` expõe `{ loggedIn, user, session }` tanto no server quanto no client
- **Middleware global** (`app/middleware/auth.global.ts`):
  - `!loggedIn && path.startsWith('/dashboard')` → redireciona para `/auth/login`
  - `loggedIn && path.startsWith('/auth')` → redireciona para `/dashboard`
- **Proteção de rotas de API**: cada handler de `server/api/` (exceto `/proposals/public/*`) chama `getUserSession(event)` e lança 401 se sem sessão
- **Rotas públicas**: `/p/:slug` (frontend) e `/api/proposals/public/*` (sem autenticação, validadas por token de query)
- **Ausência de RBAC**: todos os usuários autenticados têm as mesmas permissões; isolamento por `profileId` em todas as queries

---

## 10. Sistema de Créditos e Planos

| Plano | `creditsBalance` | `subscriptionPlan` | Renovação |
|-------|-----------------|-------------------|-----------|
| Free | 1 | `'free'` | Nunca (manual upgrade) |
| Starter | 5 | `'starter'` | Reset para 5 a cada `invoice.payment_succeeded` |
| Premium | 9999 | `'premium'` | Reset para 9999 a cada `invoice.payment_succeeded` |

**Consumo:**
- `creditsUsed` incrementa +1 a cada proposta publicada (status `draft → created`)
- `ProposalService.consumeCredit()` verifica `creditsUsed >= creditsBalance` e lança 403 se insuficiente
- Créditos avulsos (add-on): incrementam `creditsBalance` via `$inc` no webhook `checkout.session.completed` com `type === 'credits'`

**Atenção**: `creditsBalance` é sobrescrito (não incrementado) na renovação — créditos add-on são perdidos no próximo ciclo de cobrança (ver roadmap).

---

## 11. Convenções de Código

- **Services**: objetos exportados como `const NomeService = { metodo() {} }` em `server/services/`
- **Padrão de API**: handler → `NomeService.metodo()` → Model Mongoose — sem lógica de negócio nos handlers
- **Modelos**: schemas definidos inline no arquivo do model, exportados como `export const NomeModel = model(...)`
- **Componentes**: prefixo `Base*` para primitivas reutilizáveis (ex: `BaseInput`, `BaseButton`)
- **Composables**: prefixo `use*` (ex: `useAlerts`, `useUserSession`)
- **Rotas de API**: convenção de arquivo `[método].ts` (ex: `index.get.ts`, `index.post.ts`, `[id].put.ts`)
- **Rotas públicas de proposta**: agrupadas em `server/api/proposals/public/`
- **Sem DTOs formais**: dados trafegam como `any` (melhoria pendente no roadmap)
- **Imutabilidade de itens**: propostas armazenam snapshot dos itens no momento da criação (não referência ao catálogo)

---

## 12. Comandos de Desenvolvimento

```bash
npm run dev          # Dev server localhost:3000
npm run build        # Build produção
npm run preview      # Preview do build

npx vitest run       # Testes (Vitest)

stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Stripe CLI: encaminha webhooks para dev local

npx tsx scripts/backfill-stripe-subscription-state.ts
# Backfill: sincroniza estado de subscriptions existentes com Stripe
# Rodar UMA VEZ após deploy que adicionou subscriptionStatus/subscriptionEndsAt
```

---

## 13. Roadmap de Melhorias

### [HIGH] Segurança e Estabilidade

- **Rate limiting** em `/api/auth`, `/api/ai/generate`, `/api/upload/cloudinary` — ausência permite abuso e custo não controlado
- **CORS configuration** em `nuxt.config.ts` via `routeRules` — atualmente sem restrição de origem
- **Mass assignment protection** nos endpoints `PUT/POST` — usar allowlist explícita em vez de `{ ...body }` direto
- **Regex injection (ReDoS)** nos filtros de search — fazer cast para string antes de usar `$regex` no Mongoose
- **Puppeteer `--no-sandbox` + HTML não escapado** — conteúdo de `contractText`/`termsAndConditions` não é sanitizado antes de renderizar no Puppeteer; XSS pode se tornar RCE via headless browser
- **Índices MongoDB ausentes** em `profileId` nas collections Proposal, CatalogItem e Event — queries sem índice fazem full collection scan

### [HIGH] Consistência de Dados

- **Transações MongoDB** no fluxo de criação de proposta — `Counter.findOneAndUpdate` + `Proposal.create` + `creditsUsed $inc` rodam sem transação; falha parcial deixa estado inconsistente
- **`creditsBalance` sobrescrito na renovação** — add-ons comprados são perdidos quando `invoice.payment_succeeded` reseta para o valor fixo do plano

### [MED] Performance

- **Debounce em search inputs** — cada keystroke dispara uma chamada à API
- **Debounce no ViaCEP lookup** — idem para digitação do CEP
- **Lazy-load de dependências pesadas** — TipTap, FullCalendar e vue-advanced-cropper são carregados no bundle inicial; impactam LCP

### [MED] Qualidade e Manutenção

- **Componentes grandes > 300 linhas** — extrair `CropperModal`, `AddressFields` em componentes separados
- **Tipagem TypeScript** — remover usos de `any`; criar `ProfileDTO`, `ProposalDTO` nos composables de `useFetch`
- **Cobertura de testes** — apenas `tests/Billing.spec.ts` existe; expandir com fixtures Faker para proposals, clients, catalog
- **Proposta expirada não marcada automaticamente** — não há job agendado; `expiresAt` só é respeitado se o cliente tentar acessar
- **Token de proposta em URL query string** — fica gravado no histórico do browser; migrar para cookie httpOnly ou header

### [MED] Integrações

- **Email sender `onboarding@resend.dev`** — domínio de teste do Resend; emails não são entregues em produção para caixas externas. Configurar domínio customizado verificado no Resend
- **Cloudinary upload aceita URLs remotas (SSRF)** — endpoint de upload deve validar que o input é um arquivo multipart, não uma URL remota

### [LOW] Acessibilidade e UX

- **`aria-label` e `alt` ausentes** em botões de ícone e imagens sem texto alternativo
- **`console.log` em código de produção** — 10+ ocorrências no webhook handler e `ProposalForm`; remover antes de produção

---

## 14. Histórico de Decisões Técnicas

- **Remoção de auth local (2024)**: login/registro com email+senha foi removido (senha era armazenada em plaintext, sem bcrypt). Mantido exclusivamente Google OAuth via `nuxt-auth-utils`. Simplifica segurança e elimina fluxo de recuperação de senha.

- **Stripe Customer Portal (commit 0db640f)**: cancelamento de assinatura delegado ao portal externo do Stripe em vez de endpoint próprio. Reduz superfície de código, mas torna o fluxo dependente do webhook `customer.subscription.updated` com `cancel_at_period_end: true` para atualizar a UI.

- **Idempotência de webhooks Stripe**: modelo `StripeEvent` com índice unique em `eventId` e TTL de 30 dias. Duplicata (código 11000 do MongoDB) retorna 200 sem reprocessar, prevenindo double-charge e replay attacks.

- **`subscriptionPlan` vs `subscriptionStatus`**: `subscriptionPlan` (`'free'|'starter'|'premium'`) é a fonte de verdade para feature gating e controle de créditos. `subscriptionStatus` espelha o estado do Stripe (`active`, `past_due`, `canceled`, etc.) e é usado apenas para exibição informativa na UI (banners, alertas). Essa separação permite manter o acesso premium mesmo durante `cancel_at_period_end: true` até o fim do período pago.

- **Snapshot de itens na proposta**: os itens são copiados (snapshot) para `Proposal.items` no momento da criação, não referenciados do catálogo. Garante imutabilidade histórica — alterações futuras no catálogo não afetam propostas já emitidas.

- **Counter por profileId/year via `$inc` atômico**: numeração sequencial legível (`#ORC-2025-001`) implementada com `findOneAndUpdate + upsert + $inc` para garantir atomicidade sem transações. Limitação: não está em transação com o `Proposal.create`, então uma falha após o increment gera um número perdido (gap na sequência).
