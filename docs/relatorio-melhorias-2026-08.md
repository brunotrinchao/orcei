# Relatório de Melhorias e Correções — Orcei (2026-08-01)

Análise full-stack (backend Nuxt/Nitro + MongoDB, frontend Vue 3) com foco no
WIP atual (Setup Wizard de onboarding + separação do fluxo Google OAuth) e
varredura dos módulos críticos de segurança/receita (auth, admin, propostas
públicas, créditos IA, Stripe).

> Nota metodológica: a primeira tentativa usou 4 subagentes em paralelo
> (backend, frontend, P.O., segurança) — todos retornaram vazios por falha de
> ambiente (hook de sessão travado). A análise abaixo foi refeita lendo os
> arquivos-fonte diretamente.

---

## 1. Achado crítico confirmado — Wizard de onboarding entra em loop

**Arquivos:** `app/components/onboarding/OnboardingController.vue`,
`app/components/onboarding/SetupWizardModal.vue` (`handleSkip`, linha ~103-109)

O botão "pular" do wizard (`handleSkip`) só mostra um aviso e emite `close` —
**não persiste nenhum estado de skip** (nem local, nem via API). O
`OnboardingController.tryAutoStart()` roda em todo `watch(route.path)` e
reabre o wizard sempre que `profile.setupWizardCompleted` for `false`. Como
skip nunca marca esse campo (nem o `setupWizardSkippedAt` que já existe no
schema `Profile.ts` pra esse fim exato), **o usuário que pula o wizard vê ele
reaparecer a cada navegação de página** — trava o uso do produto.

O comentário no próprio código admite a intenção ("se pulou, não mostramos
mais nesta sessão") mas a implementação não faz isso.

- **Severidade:** Crítico
- **Correção:** ao clicar "pular", chamar `POST /api/profile/setup-wizard`
  (ou novo endpoint) setando `setupWizardSkippedAt = now()`; ajustar
  `tryAutoStart` pra checar `setupWizardCompleted || setupWizardSkippedAt`
  antes de reabrir. Ou, no mínimo, guardar um ref local/sessionStorage pra não
  reabrir na mesma sessão de navegação.

---

## 2. Inconsistências de schema (Google + onboarding)

| Campo | `types/index.ts` | `server/models/Profile.ts` | Efeito |
|---|---|---|---|
| Skip do onboarding | `onboardingSkippedAt` | `setupWizardSkippedAt` | Nomes divergentes — qualquer código que tente ler/gravar um dos dois nomes falha silenciosamente (undefined) |

**Correção:** unificar nome do campo nos dois lados (sugestão:
`setupWizardSkippedAt`, já usado no schema Mongo).

---

## 3. Regressão de arquitetura no fluxo Google OAuth (WIP não commitado)

O redesenho separou corretamente login (`server/api/auth/google.get.ts`,
escopos `profile+email` apenas) de conexão de integração
(`server/api/integrations/google/connect.get.ts`, escopos
`calendar.events+drive.file+userinfo.email`). Porém:

- **`google.get.ts` (login) ainda grava `accessToken`/`refreshToken` dentro
  de `profile.googleIntegration`** (linhas 34-44), mesmo não pedindo mais
  escopo de calendar/drive. Se o Google devolver um novo `refresh_token` num
  login futuro (ex.: após o usuário revogar acesso no Google e logar de
  novo), esse token **sobrescreve o refresh_token com escopo
  calendar+drive** que veio do fluxo de conexão — quebrando silenciosamente
  a integração até o usuário reconectar manualmente.
  - **Severidade:** Alto
  - **Correção:** login não deveria tocar em `accessToken`/`refreshToken`
    de `googleIntegration` — no máximo atualizar `email`. Só o fluxo
    `connect`/`callback` deveria gravar tokens de integração.

- **`disconnect.post.ts` não limpa `driveReportsFolderId`** (só limpa
  `driveFolderId` e `driveProposalsFolderId`, campo novo ficou de fora).
  - **Severidade:** Médio — pasta antiga do Drive fica "presa" no perfil
    após desconectar, pode causar upload pro Drive de outra conta/pasta
    inválida se reconectar com conta Google diferente.

---

## 4. Admin: endpoint de créditos sem validação e não-atômico

**Arquivo:** `server/api/admin/users/[id]/credits.patch.ts`

- Não valida `amount` (aceita qualquer tipo/negativo/NaN) nem `action`
  (se vier string inválida, `newBalance` fica igual ao `oldBalance` e a
  API retorna `success: true` silenciosamente — admin acha que aplicou
  e não aplicou nada).
- Read-then-write (`findById` → calcula → `findByIdAndUpdate`) — não é
  atômico. Contraste com `server/utils/credits.ts::chargeCredit`, que já
  usa `findOneAndUpdate` com guard `$gte` pra ser atômico (correção de
  race condition feita recentemente no débito de créditos por IA, ver
  commit `55dae02`). Esse endpoint admin não segue o mesmo padrão.
- **Severidade:** Médio-Alto (é admin-only, mas é dado financeiro/produto)
- **Correção:** validar com zod (`amount: number > 0`, `action: enum`),
  usar `$inc` atômico com o mesmo padrão de `chargeCredit`.

---

## 5. Segurança — pontos positivos confirmados (não é tudo achado ruim)

Vale registrar o que já está bem feito, pra não re-trabalhar:
- `proposals/public/*`: token validado com `timingSafeEqual` (anti-timing
  attack), rate limit por IP (`checkRateLimit`), sanitização de HTML do
  contrato com `sanitize-html` e allowlist restrita de tags/estilos.
- `integrations/google/connect.get.ts`: state CSRF em cookie httpOnly,
  `secure` em produção, domain correto via `getCookieDomain`.
- `webhooks/stripe.post.ts`: verifica assinatura (`stripe.webhooks.constructEvent`)
  e tem idempotência via `StripeEvent.create` (dedup de evento).
- `admin/users/[id]/impersonate.post.ts`: bloqueia impersonar outro admin,
  bloqueia impersonação aninhada, grava audit log com IP.
- Rate limit tem fallback in-memory quando Upstash Redis não configurado
  (bom pra dev, mas ver item 6 sobre isso em produção multi-instância).

## 5.1 Segurança — achados reais

- **`server/api/chat/auth.post.ts` (linha ~46):** `tokenMatches` é `true`
  quando `!proposal.token` (proposta sem token setado) **independente do
  token enviado** — só falta bater o `slug`. Se existir qualquer proposta
  legada/criada sem token, canal de chat fica acessível a qualquer um que
  souber o slug (sem precisar do token). Slug provavelmente é
  aleatório/não-sequencial, reduz risco, mas é um bypass real de auth caso
  slug vaze (ex.: em URL compartilhada, logs, Referer).
  - **Severidade:** Médio
  - **Correção:** exigir token sempre, ou gerar token obrigatoriamente na
    criação da proposta (não permitir proposta sem token).
- **Rate limit in-memory (`server/utils/rate-limit.ts`) não é
  compartilhado entre instâncias** — se a app rodar com mais de 1 processo/
  instância (Fluid Compute / múltiplos workers) sem `UPSTASH_REDIS_REST_URL`
  configurado em produção, o limite vira "por instância", não global —
  atacante pode multiplicar o limite real pelo número de instâncias.
  - **Severidade:** Médio (só se Upstash não estiver configurado em prod —
    confirmar em `.env` de produção).

---

## 6. Frontend — outros pontos

- `app/pages/p/[slug].vue`: bem construído (redirect SSR de subdomínio,
  `referrer: no-referrer` pra não vazar token no header Referer de links
  externos, chat via Pusher com token). Ponto de atenção: `useLazyFetch`
  sem tratamento visível de `error` no trecho lido (linhas 1-120) além do
  padrão do Nuxt — confirmar que existe estado de erro amigável (ex.: link
  expirado/inválido) mais abaixo no arquivo antes de assumir que está OK;
  não deu pra confirmar na amostra lida.
- `useApiErrors.ts::parseApiErrors` faz escape de HTML corretamente antes
  de montar a lista de erros — OK.

---

## 7. Priorização (impacto × esforço)

| # | Achado | Impacto | Esforço | Prioridade |
|---|---|---|---|---|
| 1 | Wizard reabre em loop ao pular (item 1) | Alto (bloqueia uso) | Baixo | **Fazer já** |
| 2 | Login sobrescreve refresh_token de integração (item 3) | Alto (quebra silenciosa) | Baixo | **Fazer já** |
| 3 | Admin credits sem validação/atomicidade (item 4) | Médio-Alto | Baixo | **Fazer já** |
| 4 | Campo `onboardingSkippedAt` vs `setupWizardSkippedAt` (item 2) | Médio | Baixo | Fazer já (resolve junto com #1) |
| 5 | `disconnect` não limpa `driveReportsFolderId` (item 3) | Médio | Baixo | Curto prazo |
| 6 | Chat auth bypass se proposta sem token (item 5.1) | Médio | Baixo | Curto prazo |
| 7 | Rate limit não distribuído sem Upstash em prod (item 5.1) | Médio (condicional) | Baixo (config) | Confirmar env de prod |
| 8 | Confirmar tratamento de erro em `p/[slug].vue` | Baixo-Médio | Baixo (verificação) | Curto prazo |

### Quick wins (mesma tarde de trabalho)
- Unificar nome do campo skip (#4) junto com o fix do loop (#1) — mesma
  mudança.
- Corrigir `google.get.ts` pra não gravar tokens de integração (#2) — poucas
  linhas, remove a regressão antes de virar bug em produção.
- Adicionar `driveReportsFolderId: undefined` no `disconnect.post.ts` (#5)
  — 1 linha.
- Validar `credits.patch.ts` com zod + trocar pra `$inc` atômico (#3).
