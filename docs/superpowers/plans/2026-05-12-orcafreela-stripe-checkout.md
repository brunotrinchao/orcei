# OrçaFreela Implementation Plan: Stripe Checkout

**Objetivo:** Permitir que o usuário realize upgrade de plano ou compre créditos via Stripe Checkout.

**Arquitetura:** Uso do Stripe Checkout (Hosted Page) para simplicidade e segurança.

---

### Task 1: Endpoint de Criação de Session [DONE]

**Arquivos:**
- Create: `server/api/stripe/checkout.post.ts`

- [x] **Step 1: Criar endpoint de checkout**
Lógica para receber o `priceId`, buscar o `stripeCustomerId` do perfil do usuário e criar uma `Stripe.Checkout.Session`.
Redirecionar para `session.url`.

- [x] **Step 2: Configurar URLs de Sucesso/Cancelamento**
Definir rotas no frontend para lidar com o retorno do Stripe.

---

### Task 2: UI de Planos no Dashboard [DONE]

**Arquivos:**
- Create: `app/pages/dashboard/billing.vue`
- Modify: `app/layouts/default.vue`

- [x] **Step 1: Criar página de Faturamento/Planos**
Exibir cards com os planos (Starter, Premium) e botão de "Assinar".

- [x] **Step 2: Integrar com endpoint de Checkout**
Chamar `/api/stripe/checkout` ao clicar nos botões.

- [x] **Step 3: Adicionar link no Menu**
Adicionar "Faturamento" ou "Assinatura" ao menu lateral/superior.

---

### Task 3: Refinamento do Webhook [DONE]

**Arquivos:**
- Modify: `server/api/webhooks/stripe.post.ts`

- [x] **Step 1: Validar tratamento de eventos**
Garantir que `checkout.session.completed` também seja tratado se necessário (para compras únicas) ou focar em `invoice.payment_succeeded`.

- [x] **Step 2: Testar via Stripe CLI**
Simular pagamentos para validar atualização do `creditsBalance` no MongoDB.
