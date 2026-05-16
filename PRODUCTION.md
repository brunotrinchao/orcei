# Guia de Deploy em Produção — Orcei

> Siga na ordem. Não pule etapas.

---

## ✅ Checklist Rápido

- [ ] Domínio configurado e apontado para o servidor
- [ ] MongoDB Atlas — IP liberado para produção
- [ ] Google OAuth — URI de redirecionamento de produção adicionado
- [ ] Stripe — chaves LIVE + webhook de produção criado
- [ ] Resend — domínio verificado + remetente atualizado
- [ ] Cloudinary — em uso (sem mudança necessária)
- [ ] Gemini API — em uso (sem mudança necessária)
- [ ] GTM — publicado (já configurado: GTM-PDLCTT2M)
- [ ] ContentSquare — em uso (script já integrado)
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] `RESEND_TEST_TO` removido
- [ ] Secrets de sessão regenerados

---

## 1. Domínio

Configure seu domínio (ex: `orcei.com.br`) apontando para o servidor/plataforma.
Certifique-se de que HTTPS está ativo (Let's Encrypt ou certificado da plataforma).

---

## 2. MongoDB Atlas

**O que fazer:**
1. Acesse [cloud.mongodb.com](https://cloud.mongodb.com)
2. Vá em **Network Access** → **Add IP Address**
3. Adicione o IP do seu servidor de produção (ou `0.0.0.0/0` se a plataforma usa IPs dinâmicos)
4. A `MONGODB_URI` não muda — mesma string de conexão

```env
MONGODB_URI=mongodb+srv://orcei_db:<senha>@orcei.xyw9rmn.mongodb.net/?appName=Orcei
```

---

## 3. Google OAuth

**O que fazer:**
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Menu → **APIs & Services** → **Credentials**
3. Clique no seu OAuth 2.0 Client ID
4. Em **Authorized redirect URIs**, adicione:
   ```
   https://seudominio.com.br/auth/google
   ```
5. Em **Authorized JavaScript origins**, adicione:
   ```
   https://seudominio.com.br
   ```
6. Salve. As chaves **não mudam**.

```env
NUXT_OAUTH_GOOGLE_CLIENT_ID=<mesmo do local>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<mesmo do local>
```

---

## 4. Stripe — CRÍTICO

> ⚠️ Em produção, use chaves LIVE (não as de teste `rk_test_` / `sk_test_`).

### 4.1 Obter chaves Live
1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Desative o modo **Test** (toggle no topo)
3. Vá em **Developers** → **API Keys**
4. Copie **Secret key** (`sk_live_...`)

```env
STRIPE_SECRET_KEY=your_stripe_live_secret_key
```

### 4.2 Criar produtos e preços Live
1. No Stripe (modo Live) → **Products** → crie os mesmos planos do ambiente de teste:
   - Starter (mensal/anual)
   - Premium (mensal/anual)
   - Créditos avulsos (5 e 10)
2. Copie os `price_live_...` IDs

```env
STRIPE_STARTER_PRICE_ID=price_live_XXXXXXX
STRIPE_PREMIUM_PRICE_ID=price_live_XXXXXXX
STRIPE_PRICE_MONTHLY=price_live_XXXXXXX
STRIPE_PRICE_ANNUAL=price_live_XXXXXXX
STRIPE_PRICE_SINGLE=price_live_XXXXXXX
STRIPE_CREDITS_5_PRICE_ID=price_live_XXXXXXX
STRIPE_CREDITS_10_PRICE_ID=price_live_XXXXXXX
```

### 4.3 Criar webhook de produção
1. Stripe → **Developers** → **Webhooks** → **Add endpoint**
2. URL:
   ```
   https://seudominio.com.br/api/webhooks/stripe
   ```
3. Eventos a selecionar:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copie o **Signing secret** (`whsec_live_...`)

```env
STRIPE_WEBHOOK_SECRET=whsec_live_XXXXXXXXXXXXXXXX
```

---

## 5. Resend — Email

> ⚠️ Remover `RESEND_TEST_TO` em produção. Sem essa variável, os emails vão para o cliente real.

### 5.1 Verificar domínio
1. Acesse [resend.com/domains](https://resend.com/domains)
2. Adicione `seudominio.com.br`
3. Configure os registros DNS (SPF, DKIM, DMARC) no seu provedor de domínio
4. Aguarde verificação (pode levar até 48h)

### 5.2 Atualizar remetente no código
Após domínio verificado, atualize `server/utils/email.ts`:
```ts
from: 'Orcei <noreply@seudominio.com.br>'
```

```env
RESEND_API_KEY=re_XXXXXXXXXXXXXXXX   # mesma chave ou gere nova
# RESEND_TEST_TO=                    # REMOVER esta linha em produção
```

---

## 6. Cloudinary

Sem mudanças necessárias. Mesmas credenciais do local funcionam em produção.

```env
CLOUDINARY_NAME=dpeaqezkb
CLOUDINARY_API_KEY=<mesmo>
CLOUDINARY_API_SECRET=<mesmo>
```

---

## 7. Gemini AI + Cloudflare (fallback)

Sem mudanças necessárias. Mesmas chaves funcionam em produção.

```env
GEMINI_API_KEY=<mesmo>
CLOUDFLARE_ACCOUNT_ID=<mesmo>
CLOUDFLARE_API_KEY=<mesmo>
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
CLOUDFLARE_FALLBACK_REGEX=true
```

---

## 8. Tracking — GTM + ContentSquare

Já configurado no código. Só garantir que a variável está no servidor:

```env
NUXT_PUBLIC_GTM_ID=GTM-PDLCTT2M
```

ContentSquare está hardcoded no composable — nenhuma configuração adicional.

---

## 9. Variáveis de Sessão — REGENERAR

> ⚠️ Nunca use os secrets de desenvolvimento em produção.

Gere novos secrets:
```bash
# No terminal, gere um secret seguro:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```env
NUXT_SESSION_SECRET=<NOVO_SECRET_GERADO>
NUXT_SESSION_PASSWORD=<NOVO_SECRET_GERADO>
```

---

## 10. URLs da Aplicação

```env
APP_NAME=Orcei
APP_ENVIRONMENT=production
NUXT_PUBLIC_SITE_URL=https://seudominio.com.br
PUBLIC_URL=https://seudominio.com.br
```

---

## 11. `.env` de Produção — Completo

```env
# ── APP ──────────────────────────────────────────
APP_NAME=Orcei
APP_ENVIRONMENT=production
NUXT_PUBLIC_SITE_URL=https://seudominio.com.br
PUBLIC_URL=https://seudominio.com.br

# ── SESSÃO ───────────────────────────────────────
NUXT_SESSION_SECRET=<GERAR NOVO>
NUXT_SESSION_PASSWORD=<GERAR NOVO>

# ── BANCO DE DADOS ───────────────────────────────
MONGODB_URI=mongodb+srv://orcei_db:<senha>@orcei.xyw9rmn.mongodb.net/?appName=Orcei

# ── GOOGLE OAUTH ─────────────────────────────────
NUXT_OAUTH_GOOGLE_CLIENT_ID=<mesmo do local>
NUXT_OAUTH_GOOGLE_CLIENT_SECRET=<mesmo do local>

# ── STRIPE (LIVE) ─────────────────────────────────
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_live_XXXXXXXXXXXXXXXX
STRIPE_STARTER_PRICE_ID=price_live_XXXXXXX
STRIPE_PREMIUM_PRICE_ID=price_live_XXXXXXX
STRIPE_PRICE_MONTHLY=price_live_XXXXXXX
STRIPE_PRICE_ANNUAL=price_live_XXXXXXX
STRIPE_PRICE_SINGLE=price_live_XXXXXXX
STRIPE_CREDITS_5_PRICE_ID=price_live_XXXXXXX
STRIPE_CREDITS_10_PRICE_ID=price_live_XXXXXXX

# ── EMAIL ─────────────────────────────────────────
RESEND_API_KEY=re_XXXXXXXXXXXXXXXX
# RESEND_TEST_TO → NÃO ADICIONAR EM PRODUÇÃO

# ── STORAGE ──────────────────────────────────────
CLOUDINARY_NAME=dpeaqezkb
CLOUDINARY_API_KEY=<mesmo>
CLOUDINARY_API_SECRET=<mesmo>

# ── IA ───────────────────────────────────────────
GEMINI_API_KEY=<mesmo>
CLOUDFLARE_ACCOUNT_ID=<mesmo>
CLOUDFLARE_API_KEY=<mesmo>
CLOUDFLARE_AI_MODEL=@cf/meta/llama-3.1-8b-instruct
CLOUDFLARE_FALLBACK_REGEX=true

# ── TRACKING ─────────────────────────────────────
NUXT_PUBLIC_GTM_ID=GTM-PDLCTT2M
```

---

## 12. Build e Deploy

```bash
npm run build
node .output/server/index.mjs
```

Ou via plataforma (Vercel, Railway, Render, Coolify):
- **Build command:** `npm run build`
- **Output directory:** `.output`
- **Start command:** `node .output/server/index.mjs`
- **Node version:** 18+

---

## 13. Pós-Deploy — Verificações

- [ ] Acessar `https://seudominio.com.br` → landing carrega
- [ ] Login com Google funciona
- [ ] Criar orçamento e enviar email → chegou para o cliente real
- [ ] Stripe checkout funciona (modo live)
- [ ] DevTools → Network: GTM carrega SÓ após aceitar cookies
- [ ] `/privacy` e `/terms` acessíveis
- [ ] "Gerenciar Cookies" no footer reabre o banner
