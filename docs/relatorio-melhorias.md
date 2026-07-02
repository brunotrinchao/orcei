# Relatorio de Melhorias — Orcei Facil

**Analise multi-agente: P.O. + UX/UI + Marketing + Micro-SaaS**
**Data:** Junho 2026
**Stack:** Nuxt 4 + Vue 3 + TypeScript + MongoDB + Stripe + Gemini AI + Vercel

---

## Sumario Executivo

O Orcei Facil tem fundamentos tecnicos solidos e diferenciais reais para o mercado brasileiro (IA generativa nativa, preco agressivo, PT-BR nativo, contratos com clausulas brasileiras). Os principais gaps sao de produto e go-to-market: ausencia de feature gates entre planos, viral loop nao instrumentado, onboarding inexistente, e funcionalidades criticas para o mercado BR (PIX, WhatsApp) pendentes.

---

## PARTE 1 — GAPS DE PRODUTO (P.O.)

### 1.1 Funcionalidades Ausentes ou Incompletas

| #   | Gap                                               | Impacto                                                                               | Evidencia no Codigo                                                      |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | **Nenhum endpoint DELETE para propostas**         | Rascunhos acumulam indefinidamente no banco                                           | Ausente em `server/api/proposals/`                                       |
| 2   | **Sem clonar/duplicar proposta**                  | Freelancer recria tudo do zero para clientes similares                                | Nenhum endpoint `clone`                                                  |
| 3   | **`expiresAt` nao e executado automaticamente**   | Proposta expirada ainda aceita cliques                                                | Sem cron/job; so visual                                                  |
| 4   | **WhatsApp prometido mas nao implementado**       | Campo `isWhatsapp` existe no `Client.ts`; envio e manual                              | `SendMethod` so tem `MANUAL`/`AUTO`                                      |
| 5   | **PIX ausente como metodo de pagamento**          | Metodo dominante no Brasil nao esta disponivel                                        | `PaymentMethod`: apenas `cash` e `credit_card`                           |
| 6   | **Aceita orçamento digital nao existe**           | Landing menciona "Aceita orçamento digital padrao"                                    | Nenhuma integracao DocuSign/Clicksign                                    |
| 7   | **Relatorios IA sem estrutura**                   | Nao e possivel filtrar, comparar ou exportar                                          | `Report.ts`: apenas `content: String` e `context: Mixed`                 |
| 8   | **Recuperacao de carrinho inativa**               | Usuarios que abandonam checkout nunca sao re-engajados                                | `stripe.post.ts:325`: apenas `console.log`                               |
| 9   | **Race condition no consumo de creditos IA**      | Dois requests simultaneos podem consumir 1 credito porem servir 2                     | `ai/analyze.get.ts:27`, `ai/generate.post.ts:29`: nao usa `$inc` atomico |
| 10  | **Rate limiter in-memory ineficaz em serverless** | Em Vercel, cada cold start cria novo `Map` — rate limit nao funciona entre instancias | `rate-limit.ts:1`                                                        |

### 1.2 Jobs-To-Be-Done Nao Atendidos

| Job                                                    | Status                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| Enviar proposta por WhatsApp                           | Nao atendido — apenas email automatico                             |
| Receber pagamento diretamente pela proposta (PIX/link) | Nao atendido                                                       |
| Gerar nota fiscal apos aceite                          | Nao atendido                                                       |
| Pipeline visual de vendas (Kanban)                     | Nao atendido — listagem tabular apenas                             |
| Importar clientes via CSV                              | Nao atendido                                                       |
| Coletar motivo de recusa                               | Parcial — `requestChanges` aceita notes, mas `declineProposal` nao |
| Multi-usuario/equipe                                   | Nao atendido — `Profile` e 1:1 com `userId`                        |

### 1.3 Metricas Rastreadas vs Deveriam Existir

**Rastreadas hoje** (`server/api/dashboard/stats.get.ts`):

- Propostas criadas, aceitas, ticket medio, taxa de aprovacao, TMA, SLA, ROI de IA, ranking de clientes, distribuicao de status, follow-up alerts.

**Problemas nas metricas existentes:**

- `approvalRate` inclui rascunhos no denominador — resultado artificialmente baixo.
- `tmaHours` usa `updatedAt` que pode ser alterado por qualquer edicao.
- `aiRoi` usa valores hard-coded (`12min/proposta`, `5min/catalogo`) sem base empirica.
- GTM configurado no `nuxt.config.ts` mas **nao injetado** — sem eventos rastreados.

**Metricas ausentes criticas:**

- Funil completo etapa a etapa (criada → enviada → aberta → aceita) com taxas de conversao.
- Activation rate (% de novos usuarios que criam proposta em 48h).
- Viral coefficient (signups via "Powered by" — sem UTM, sem tracking).
- Cohort analysis de retencao.

### 1.4 Analise de Planos e Monetizacao

**Modelo atual:** Freemium (1 credito inicial) + creditos avulsos vitalicios + assinatura recorrente.

| Aspecto                       | Situacao                                               |
| ----------------------------- | ------------------------------------------------------ |
| Credito inicial               | 1 — insuficiente para gerar habito                     |
| Feature gates por plano       | **Ausentes** — Free tem acesso a tudo igual ao Premium |
| Expiracao de creditos avulsos | Nunca expiram — reduz urgencia de uso                  |
| `MONTHLY`/`ANNUAL` no enum    | Existem mas checkout usa `one_time` na tela de planos  |
| Preco avulso ancora (R$ 5,90) | Hard-coded em `plans.get.ts:86`                        |

**Upsells nao explorados:**

- Templates premium por segmento (tech, design, marketing)
- Dominio customizado para link publico (`/p/{slug}` → dominio proprio)
- Remocao de branding "Powered by Orcei"
- Relatorios IA ilimitados como tier Premium
- Backup automatico agendado
- Chat e view tracking como features premium

---

## PARTE 2 — UX/UI

### 2.1 Problemas Criticos (Bloqueadores de Conversao)

**1. Zero onboarding para novo usuario**
O callback de login redireciona direto para `/dashboard` com KPIs zerados (R$ 0, 0%, 0h). Nao ha wizard, checklist, ou empty state funcional. O "Cockpit Comercial" e intimidador para quem acabou de criar conta.

**2. Campos disabled sem hint em `ProposalStepClient`**
Campos `readonly`/`disabled` sem texto explicando "selecione um cliente acima para preencher". Usuario tenta clicar e nao entende o bloqueio.

**3. Email gerado automaticamente sem aviso**
Em `ProposalStepClient.vue:72`:

```js
email: extractedData.email ||
  `${extractedData.name.toLowerCase().replace(/\s+/g, "")}@empresa.com`;
```

Email falso criado silenciosamente. Proposta enviada para endereco inexistente sem nenhum aviso.

**4. `AIProposalWizard` sem tratamento de erros**
`handleFinish` usa `Promise.all` sem `catch`. Erro parcial (alguns itens criados, outros nao) passa silenciosamente com `emit('success')`.

**5. Botao "Ver Proposta" no dashboard leva para lista, nao para proposta**
`dashboard/index.vue:422` — link aponta para `/orcamentos` (lista geral) em vez da proposta especifica.

### 2.2 Experiencia do Cliente Final (`/p/[slug]`)

**O que esta bem:** skeleton loading consistente, sticky header, bottom bar mobile com safe area, chat estilo WhatsApp com indicadores de leitura, overlay de aceite com transicao verde, distinção visual entre proposal viewer e preview mode.

**Problemas:**

| #   | Problema                                                                                                                | Severidade |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Botao "Recusar Proposta" **ausente** na bottom bar mobile                                                               | Critico    |
| 2   | Dados de contato no painel de decisao exibem email/WhatsApp **do cliente para ele mesmo** (deveria ser do profissional) | Critico    |
| 3   | Chat desabilitado pos-aceite sem alternativa de contato                                                                 | Medio      |
| 4   | Overlay verde de aceite sem CTA ou instrucao do proximo passo                                                           | Medio      |
| 5   | Ausencia de confirmacao por email para o cliente apos aceite                                                            | Medio      |

### 2.3 Design System — Lacunas e Inconsistencias

| Problema                             | Detalhe                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `BaseBadge` ignorado                 | 3 variacoes visuais de badge inline em vez do componente                      |
| `BaseButton` ignorado em `/p/[slug]` | Todos os botoes sao `<button>` raw com classes manuais                        |
| `BaseTextarea` ausente               | Textareas avulsas em 3+ arquivos com estilos diferentes                       |
| `BaseCard`/`BaseFormSection` ausente | `rounded-[2.5rem]`, `rounded-[3rem]`, `rounded-3xl`, `rounded-2xl` misturados |
| `dark:` classes orfas                | `ProposalStepClient.vue` tem `dark:bg-slate-950` sem dark mode configurado    |
| Tipografia extrema                   | Escala de `text-[8px]` a `text-5xl` na mesma tela; textos abaixo de 11px      |

### 2.4 Quick Wins de UX (Ordenados por ROI)

| #     | Fix                                                | Esforco | Impacto |
| ----- | -------------------------------------------------- | ------- | ------- |
| QW-1  | Corrigir link "Ver Proposta" no dashboard          | 30 min  | Critico |
| QW-2  | Adicionar botao "Recusar" na bottom bar mobile     | 1h      | Critico |
| QW-3  | Corrigir dados de contato no painel de decisao     | 1h      | Critico |
| QW-4  | Aviso visual para email gerado automaticamente     | 1h      | Alto    |
| QW-5  | Empty state funcional no dashboard para conta nova | 2h      | Alto    |
| QW-6  | Proximo passo no overlay de aceite                 | 2h      | Medio   |
| QW-7  | Loading indicator ao trocar periodo no dashboard   | 45 min  | Medio   |
| QW-8  | Hint em campos disabled do `ProposalStepClient`    | 30 min  | Medio   |
| QW-9  | Criar `BaseTextarea` no design system              | 3h      | Baixo   |
| QW-10 | Remover `dark:` classes orfas                      | 1h      | Baixo   |

---

## PARTE 3 — MARKETING E CRESCIMENTO

### 3.1 Landing Page — Analise

**O que funciona:**

- Headline orientado a beneficio com CTA de primeira pessoa.
- Schema.org JSON-LD avancado com `WebApplication`, `Product` e `FAQPage`.
- Preload da imagem hero com `fetchpriority="high"`.
- Componentes: Hero, Stats, AIBeforeAfter, Features, HowItWorks, FAQ, CTA Final.

**Problemas criticos:**

| Problema                                                                   | Impacto                                            |
| -------------------------------------------------------------------------- | -------------------------------------------------- |
| `LandingPricing.vue` **existe mas NAO esta incluido na `index.vue`**       | Visitante nao ve preco — grande perda de conversao |
| Numeros de prova social hard-coded (`2.400+ orcamentos`, `98% satisfacao`) | Risco de desconfianca se nao forem reais           |
| Ausencia de depoimentos reais                                              | Sem `LandingTestimonials.vue`                      |
| Sitemap com apenas 2 URLs (`/` e `/auth/login`)                            | SEO organico praticamente nulo                     |
| Paginas publicas `/p/[slug]` sem `useSeoMeta()`                            | Oportunidade de indexacao perdida                  |
| Sem blog ou conteudo indexavel                                             | Zero trafego organico via conteudo                 |

### 3.2 Viral Loop — O Maior Erro de Growth

Em `app/pages/p/[slug].vue:497`:

```html
<p class="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">
  Powered by {{ systemInfo?.landingPage?.appName || 'Orcei' }}
</p>
```

O "Powered by Orcei" existe mas:

- **Texto em 9px com `text-gray-300`** — praticamente invisivel.
- **Sem link clicavel** — o cliente do freelancer ve o texto mas nao pode clicar.
- **Sem UTM** — impossivel rastrear quantos signups vieram das propostas.
- **No PDF gerado: ausente** — orcamentos compartilhados como PDF nao geram nenhuma exposicao de marca.

**Jornada atual:**

```
Cliente abre /p/[slug] → Ve "Powered by Orcei" (9px, sem link) → FIM
```

**Jornada ideal:**

```
Cliente abre /p/[slug] → Ve CTA "Crie seus orcamentos gratis" (link com UTM)
→ Landing page → Signup → Novo usuario
```

### 3.3 Funil de Conversao — Problemas

1. **Google OAuth como unico metodo de login** — exclui PMEs com emails corporativos nao-Google.
2. **Apenas 1 credito gratuito** — insuficiente para gerar habito; gap abrupto para R$ 29,90/mes.
3. **Nenhum email de nurturing** apos welcome (D+1, D+3, D+7 ausentes).
4. **Sem email de reativacao** para usuarios inativos (D+14, D+30).
5. **Recuperacao de carrinho** (`checkout.session.expired`) apenas loga — nao envia email.

### 3.4 Oportunidades de Crescimento

**Conteudo SEO (volume de busca BR):**

- "modelo de orcamento para freelancer" — 2.4K/mes
- "como fazer orcamento de servico" — 1.9K/mes
- "proposta comercial template" — 1.6K/mes
- "contrato de prestacao de servico freelancer" — 880/mes

O produto ja tem templates de contrato embutidos (`defaultContractTemplate`). Publicar como conteudo SEO = trafego qualificado gratuito.

**Canais de aquisicao prioritarios:**

- Grupos de freelancers no WhatsApp/Facebook/Discord BR.
- Communities: 99Freelas, Workana, GetNinjas.
- Programa de referral ("Indique e ganhe 3 creditos") — zero custo de aquisicao.

---

## PARTE 4 — MICRO-SAAS: MONETIZACAO E ESCALABILIDADE

### 4.1 Modelo de Monetizacao — Diagnostico

**Problema central:** Nao ha diferenciacao de features entre planos. Um usuario Free com creditos avulsos tem acesso identico ao Premium. A assinatura so se justifica por volume de creditos — proposta de valor fraca.

**Creditos que consomem:**

- Publicar proposta (sair de draft): 1 credito.
- Gerar relatorio IA: 1 credito.
- Gerar texto IA: 1 credito.
- Sugerir itens de catalogo: **nao cobra credito** (inconsistente).

### 4.2 Churn — Riscos Identificados

| Risco                                             | Evidencia                                                              |
| ------------------------------------------------- | ---------------------------------------------------------------------- |
| Sem diferenciacao por plano                       | Todos acessam view tracking, upsell items, chat, Google integration    |
| Dashboard stats sem historico persistido          | `stats.get.ts` calcula on-the-fly; perda de dados ao deletar propostas |
| Sem notificacao de proposta visualizada por email | `views` existe mas nao dispara email ao freelancer                     |
| Sem notificacao de proposta expirando             | `expiresAt` existe mas sem cron/job                                    |
| Onboarding inexistente                            | Usuario ganha 1 credito e pode desistir antes de ver valor             |

### 4.3 Gargalos Tecnicos para Escala

| Gargalo                              | Impacto                                                                 | Solucao                                               |
| ------------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| Rate limiter in-memory no serverless | Rate limit ineficaz em producao (cada instancia Vercel tem Map proprio) | Migrar para Upstash Redis                             |
| Dashboard sem paginacao              | `Proposal.find()` sem limite — lento com 1k+ propostas                  | Aggregation pipeline MongoDB                          |
| Race condition creditos IA           | `profile.creditsBalance -= 1; await profile.save()` — nao atomico       | Usar `$inc` como em `ProposalService.consumeCredit()` |
| PDF com Puppeteer serverless         | Cold start 3-5s; limite 50MB Vercel                                     | Migrar para Cloud Run dedicado                        |
| MongoDB sem transactions no M0       | Sem garantias ACID no free tier                                         | Upgrade para Atlas M2+                                |

### 4.4 Benchmarks Competitivos

| Feature                       | Orcei Facil                | Proposify     | PandaDoc    | Better Proposals |
| ----------------------------- | -------------------------- | ------------- | ----------- | ---------------- |
| Preco mensal                  | R$ 29-49 (~$6-10)          | USD 49+       | USD 35+     | USD 19+          |
| PT-BR nativo + BRL            | **Sim**                    | Nao           | Parcial     | Nao              |
| IA generativa                 | **Gemini 2.5**             | GPT (recente) | GPT         | Nao              |
| Chat na proposta              | **Sim (Pusher real-time)** | Comentarios   | Comentarios | Nao              |
| View tracking                 | IP + browser + localizacao | Avancado      | Avancado    | Basico           |
| Google Drive/Calendar auto    | **Sim**                    | Integracao    | Integracao  | Nao              |
| Aceita orçamento digital real | Nao                        | Sim           | Sim         | Sim              |
| Multi-usuario                 | Nao                        | Sim           | Sim         | Sim              |
| PIX                           | Nao                        | Nao           | Nao         | Nao              |
| WhatsApp                      | Nao                        | Nao           | Nao         | Nao              |

**Vantagem competitiva real:** 10x mais barato que concorrentes globais, IA nativa, PT-BR completo, contratos com clausulas brasileiras. WhatsApp + PIX seriam killer features exclusivas do mercado BR.

---

## ROADMAP CONSOLIDADO

### Horizonte 1 — 0 a 3 meses (Quick Wins)

| #     | Iniciativa                                                                              | Esforco | Impacto |
| ----- | --------------------------------------------------------------------------------------- | ------- | ------- |
| H1-1  | **Adicionar link + UTM no "Powered by"** na proposta publica                            | Minimo  | Alto    |
| H1-2  | **Incluir `LandingPricing.vue` na `index.vue`** (componente ja existe)                  | Minimo  | Alto    |
| H1-3  | **Corrigir race condition de creditos IA** — usar `$inc` atomico                        | Baixo   | Critico |
| H1-4  | **Migrar rate limiter para Upstash Redis**                                              | Baixo   | Critico |
| H1-5  | **Ativar recuperacao de carrinho** — email real no `checkout.session.expired`           | Baixo   | Medio   |
| H1-6  | **Corrigir bugs UX criticos** (link dashboard, botao recusar mobile, contato invertido) | Baixo   | Critico |
| H1-7  | **Aumentar creditos iniciais** de 1 para 3-5                                            | Minimo  | Alto    |
| H1-8  | **Cron job de expiracao de propostas**                                                  | Baixo   | Alto    |
| H1-9  | **Adicionar PIX ao `PaymentMethod`**                                                    | Baixo   | Alto    |
| H1-10 | **Corrigir `approvalRate`** para excluir rascunhos                                      | Minimo  | Medio   |
| H1-11 | **Implementar soft-delete e clone** de propostas                                        | Baixo   | Alto    |
| H1-12 | **Ativar GTM** — plugin Nuxt ja configurado, nao injetado                               | Minimo  | Alto    |
| H1-13 | **Powered by Orcei no PDF gerado**                                                      | Baixo   | Alto    |
| H1-14 | **Onboarding checklist** pos-signup (completar perfil, criar servico, enviar proposta)  | Medio   | Alto    |
| H1-15 | **Sequencia de emails nurturing** (D+1, D+3, D+7)                                       | Medio   | Alto    |

### Horizonte 2 — 3 a 9 meses (Expansao de Receita)

| #     | Iniciativa                                                                         | Esforco | Impacto    |
| ----- | ---------------------------------------------------------------------------------- | ------- | ---------- |
| H2-1  | **Feature gates por plano** (view tracking, chat, Google integration como Premium) | Medio   | Alto       |
| H2-2  | **WhatsApp Business API** para envio de propostas                                  | Alto    | Muito Alto |
| H2-3  | **QR Code PIX na proposta aceita** — pagamento direto                              | Medio   | Alto       |
| H2-4  | **Templates de proposta reutilizaveis**                                            | Medio   | Alto       |
| H2-5  | **CRM basico embutido** (pipeline Kanban, tags, lembretes)                         | Alto    | Alto       |
| H2-6  | **Dominio personalizado** para links de proposta (add-on pago)                     | Medio   | Medio      |
| H2-7  | **Dashboard historico persistido** (snapshots mensais)                             | Medio   | Medio      |
| H2-8  | **Aceita orçamento digital real** (Clicksign/DocuSign)                             | Alto    | Alto       |
| H2-9  | **Programa de referral** ("Indique e ganhe 3 creditos")                            | Medio   | Alto       |
| H2-10 | **Blog + templates SEO** (modelo de orcamento, contrato freelancer)                | Alto    | Alto       |
| H2-11 | **Trial de 7 dias** do plano Mensal (10 creditos)                                  | Baixo   | Medio      |
| H2-12 | **Email de reativacao** para usuarios inativos                                     | Baixo   | Medio      |

### Horizonte 3 — 9 a 18 meses (Plataforma)

| #    | Iniciativa                                             | Esforco    | Impacto       |
| ---- | ------------------------------------------------------ | ---------- | ------------- |
| H3-1 | **Multi-usuario/equipe** com permissoes                | Muito Alto | Alto          |
| H3-2 | **API publica + Webhooks de saida** (Zapier/Make/n8n)  | Alto       | Medio         |
| H3-3 | **NFS-e automatizada** pos-aceite                      | Alto       | Alto (BR)     |
| H3-4 | **White-label completo** para agencias                 | Muito Alto | Alto          |
| H3-5 | **PDF service externo** (Cloud Run/Lambda)             | Medio      | Alto (escala) |
| H3-6 | **Marketplace de templates** por segmento e comunidade | Alto       | Medio         |

---

## MATRIZ DE PRIORIDADE CONSOLIDADA

### Critico (Fazer Esta Semana)

1. Corrigir race condition de creditos IA (`$inc` atomico)
2. Migrar rate limiter para Redis (Upstash Redis)
3. Incluir `LandingPricing.vue` na landing (componente ja existe — 5 minutos)
4. Adicionar link + UTM no "Powered by" da proposta publica
5. Corrigir botao "Ver Proposta" no dashboard (30 min)
6. Corrigir botao "Recusar" ausente na bottom bar mobile
7. Corrigir dados de contato invertidos em `/p/[slug]`

### Alto (Proximo Sprint)

8. Adicionar PIX ao `PaymentMethod`
9. Aumentar creditos iniciais de 1 para 3-5
10. Cron job de expiracao de propostas
11. Soft-delete + clone de proposta
12. Ativar GTM (ja configurado, nao injetado)
13. Ativar recuperacao de carrinho (email no `checkout.session.expired`)
14. Onboarding checklist pos-signup

### Medio (Proximo Mes)

15. Feature gates por plano
16. Templates de proposta reutilizaveis
17. Sequencia de emails nurturing
18. Powered by Orcei no PDF gerado
19. Blog com templates SEO
20. Trial de 7 dias do plano Mensal

---

_Analise gerada por 4 agentes especializados (P.O., UX/UI, Marketing, Micro-SaaS) com base no codigo-fonte real do projeto._
