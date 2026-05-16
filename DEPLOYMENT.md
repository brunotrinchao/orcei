# Guia de Implementação em Produção - Orcei

Este documento descreve os passos necessários para colocar a plataforma **Orcei** em um ambiente de produção estável e seguro.

## 1. Pré-requisitos de Infraestrutura

- **Plataforma de Hospedagem**: Recomendado **Vercel** ou **Netlify** (Nuxt 3 nativo).
- **Banco de Dados**: Instância **MongoDB Atlas** (Cluster M0 ou superior).
- **Armazenamento de Imagens**: Conta no **Cloudinary**.
- **E-mails Transacionais**: Conta no **Resend**.
- **Pagamentos**: Conta no **Stripe** (Modo Live).
- **IA**: Chave de API do **Google Gemini** (Vertex AI ou Google AI Studio).

## 2. Configuração de Variáveis de Ambiente (.env)

Configure as seguintes variáveis no seu painel de controle de hospedagem (Vercel/Netlify):

```env
# APP
NUXT_PUBLIC_SITE_URL=https://seudominio.com.br
APP_NAME=Orcei
APP_ENVIRONMENT=production

# DATABASE
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/orcei

# AUTH (nuxt-auth-utils)
# Gere uma chave forte: openssl rand -base64 32
NUXT_SESSION_PASSWORD=<chave_secreta_longa>
NUXT_OAUTH_GOOGLE_CLIENT_ID=<id_google_oauth>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<secret_google_oauth>

# STRIPE
STRIPE_SECRET_KEY=live_secret_key_here
STRIPE_WEBHOOK_SECRET=webhook_secret_here
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=live_publishable_key_here

# PREÇOS STRIPE (IDs do modo Live)
NUXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_...
NUXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_PRICE_SINGLE=price_... # Crédito avulso

# CLOUDINARY
CLOUDINARY_NAME=<seu_cloud_name>
CLOUDINARY_API_KEY=<sua_api_key>
CLOUDINARY_API_SECRET=<seu_api_secret>

# RESEND (E-mails)
RESEND_API_KEY=re_...

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=...
```

## 3. Passo a Passo da Implementação

### Passo 1: Preparação do Banco de Dados
1. Crie um novo Cluster no **MongoDB Atlas**.
2. No menu "Network Access", libere o IP da sua plataforma de hospedagem (ou use `0.0.0.0/0` se necessário).
3. Obtenha a Connection String.

### Passo 2: Configuração do Stripe (Live)
1. Crie os produtos **Starter**, **Premium** e **Crédito Avulso** no painel do Stripe.
2. Configure o **Customer Portal** nas configurações do Stripe para permitir que usuários gerenciem suas assinaturas.
3. Configure o **Webhook**:
   - URL: `https://seudominio.com.br/api/webhooks/stripe`
   - Eventos necessários:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`

### Passo 3: Configuração do Cloudinary
1. Crie uma pasta `production/orcei` no seu Media Library.
2. Certifique-se de que o `folderPath` no arquivo `server/api/upload/cloudinary.post.ts` está alinhado com sua estrutura.

### Passo 4: Deploy da Aplicação
1. Conecte seu repositório Git à **Vercel**.
2. Adicione todas as variáveis de ambiente mencionadas acima.
3. Execute o comando de build: `npm run build`.
4. O Nuxt detectará automaticamente o preset da Vercel.

### Passo 5: Verificação Pós-Deploy
1. Teste o fluxo de login com Google.
2. Tente criar um item no catálogo com imagem (valida Cloudinary).
3. Gere uma proposta de teste e envie para seu e-mail (valida Resend).
4. Verifique se o webhook do Stripe responde com status `200` em um evento de teste.

## 4. Manutenção e Monitoramento

- **Logs**: Utilize `npx nuxi logs` (se disponível) ou o painel da Vercel para monitorar erros de SSR.
- **Backups**: Configure backups automáticos no MongoDB Atlas.
- **Segurança**: Nunca exponha chaves `sk_live` ou `RESEND_API_KEY` no frontend. Use sempre o lado do servidor (`server/api`).

---
*Documento gerado em maio de 2026 para a equipe Orcei.*
