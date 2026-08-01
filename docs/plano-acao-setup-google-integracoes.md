# Plano de Ação — Setup Inicial, Login/Integrações Google e Fallback de PDF

Consolida (1) os pontos do `relatorio-melhorias-2026-08.md` que vamos corrigir
agora e (2) o novo escopo de produto (spec trazida via Gemini), já cruzado
com o código real do projeto — não é só a spec do Gemini "as is", porque
parte do que ela pede pra "analisar" eu já analisei lendo o código.

---

## 1. Itens do relatório anterior que vamos atuar agora

| # | Item | Arquivo | Severidade |
|---|---|---|---|
| 1 | Wizard reabre em loop ao pular (`handleSkip` não persiste nada) | `SetupWizardModal.vue`, `OnboardingController.vue` | Crítico |
| 2 | Login (`google.get.ts`) sobrescreve `accessToken`/`refreshToken` de integração | `server/api/auth/google.get.ts` | Alto |
| 3 | `credits.patch.ts` sem validação e não-atômico | `server/api/admin/users/[id]/credits.patch.ts` | Médio-Alto |
| 4 | Campo de skip com nomes divergentes (`onboardingSkippedAt` vs `setupWizardSkippedAt`) | `types/index.ts`, `Profile.ts` | Médio |
| 5 | `disconnect.post.ts` não limpa `driveReportsFolderId` | `server/api/integrations/google/disconnect.post.ts` | Médio |

Os itens 1 e 4 se resolvem juntos com o requisito **A** abaixo (o campo
`setupWizardSkippedAt` já existe no schema, só nunca é gravado).

O item 2 é pré-requisito técnico do requisito **C/E** abaixo: se o login
sobrescreve o refresh_token de integração com um token sem escopo de
Drive/Calendar, a automação passa a falhar silenciosamente mesmo com
"integração ativa" (refreshToken presente, mas sem permissão real) — é
exatamente o cenário que o novo requisito D/E quer tratar. Corrigir a causa
(item 2) antes de só tratar o sintoma (fallback) evita mascarar o bug.

---

## 2. Novo escopo de produto — Setup, Google, PDF (spec + achados reais)

### A. Pular setup grava timestamp, reaparece só depois de 24h

**Hoje:** `handleSkip()` (linha ~103 de `SetupWizardModal.vue`) só mostra um
aviso e fecha o modal — não grava nada. `OnboardingController.tryAutoStart()`
reabre o wizard a cada navegação de página enquanto `setupWizardCompleted`
for `false`.

**Fazer:**
- Endpoint: reaproveitar `POST /api/profile/setup-wizard` com um modo "skip"
  (ex. `{ skip: true }`) ou endpoint novo `POST /api/profile/setup-wizard/skip`
  que seta `setupWizardSkippedAt = new Date()` no `Profile`.
- `tryAutoStart()`: só mostra o wizard se
  `!setupWizardCompleted && (!setupWizardSkippedAt || Date.now() - new Date(setupWizardSkippedAt).getTime() > 24h)`.
- Resolve ao mesmo tempo o item 1 (loop) e o item 4 (nome de campo — usar
  `setupWizardSkippedAt`, que já existe no schema Mongo; remover/alinhar o
  `onboardingSkippedAt` de `types/index.ts`).

### B. Opção manual de refazer o setup nas Configurações

**Onde encaixar (já mapeado no código):** `app/pages/configuracoes/index.vue`,
na mesma seção onde já existem os botões "Conectar com Google" / "Desconectar"
(linhas ~310-395). Adicionar um botão "Refazer configuração inicial".

**Problema de arquitetura a resolver:** `SetupWizardModal` hoje só é montado
dentro de `OnboardingController.vue` (que vive no layout global), controlado
por um `ref` local (`showWizard`) daquele componente — `configuracoes/index.vue`
não tem como abrir esse modal diretamente. Precisa expor um estado
compartilhado, ex.: adicionar ao composable `useOnboarding()` (já existe em
`app/composables/onboarding/useOnboarding.ts`) um `openSetupWizard()` /
estado `isSetupWizardOpen` que tanto `OnboardingController` quanto
`configuracoes/index.vue` consomem — evita duplicar o componente do wizard.

### C. Drive obrigatório / Calendar opcional, conexões separadas

**Realidade atual do código:** `connect.get.ts` pede os dois escopos
(`calendar.events` + `drive.file`) numa única concessão OAuth, e
`googleIntegration.refreshToken` é uma flag única — não existe hoje como
saber se o usuário concedeu só Drive, só Calendar, ou os dois. A tela de
configurações já mostra "Conectar/Desconectar" separado visualmente para
Calendar e Drive (2 blocos de UI), mas ambos checam o **mesmo**
`refreshToken` — ou seja, visualmente parece separado, mas funcionalmente é
tudo-ou-nada.

**Fazer (MVP, sem reescrever pra OAuth incremental completo):**
- No `callback.get.ts`, gravar o campo `tokens.scope` retornado pelo Google
  em `googleIntegration.grantedScopes: string[]` (split por espaço).
- Trocar todo `if (profile.googleIntegration?.refreshToken)` (usado em
  `ProposalService.ts:386`, `qstash.post.ts:196`, `pdf.get.ts:30`,
  `configuracoes/index.vue`) por checagem de escopo específico:
  `grantedScopes?.includes('https://www.googleapis.com/auth/drive.file')`
  e o equivalente pra calendar.
- Se depois quiser permitir conectar só um dos dois de fato (não só exibir
  separado), a rota `connect.get.ts` precisa aceitar um parâmetro
  (`?feature=drive` ou `?feature=calendar`) e montar o array de `scope` do
  `generateAuthUrl` condicionalmente — Google faz auth incremental normalmente
  (mantém escopos já concedidos antes e soma o novo), então isso é viável sem
  quebrar o que já foi concedido.

### D. Geração de PDF sem Drive — já funciona, só falta usar o critério certo

Não é um gap, é um ponto positivo a preservar: **já existe** fallback pra PDF
sem Drive, em dois lugares:
- `server/api/proposals/[id]/pdf.get.ts` (download manual): gera localmente
  via `generateProposalPdfBuffer` se não houver `driveFileId` ou
  `refreshToken`.
- `ProposalService.acceptProposal` (e-mail ao cliente quando aceita):
  **sempre** gera o PDF localmente pro e-mail, independente de Drive.

**Ação:** só trocar a condição de `refreshToken` por `grantedScopes` (item C)
pra não achar que tem Drive quando na verdade só tem Calendar (ou vice-versa,
uma vez que C seja implementado).

### E. Fallback e aviso quando falta permissão — gap real confirmado

**Achado, não hipótese:** em `server/api/webhooks/qstash.post.ts` (função da
automação pós-aceite, linhas ~190-237), o fluxo é uma cadeia única sem
try/catch interno: `ensureFolder → ensureProposalsFolder → ensureClientFolder
→ uploadPdf → createEvent`. Se o upload no Drive falhar (token revogado,
escopo insuficiente, pasta deletada manualmente pelo usuário), **a criação
do evento de Calendar nunca roda** — mesmo que o usuário tenha Calendar
plenamente autorizado. Drive e Calendar estão acoplados nessa automação, não
independentes. E quando falha, só vira `console.error` — o usuário nunca é
avisado.

**Fazer:**
1. Separar em dois blocos `try/catch` independentes: um pro upload no Drive
   (ensureFolder…uploadPdf), outro pro evento de Calendar — Calendar não deve
   depender do sucesso do Drive (hoje depende, porque usa
   `driveFile.webViewLink` na descrição do evento; nesse caso, se Drive
   falhar, criar o evento sem o link, não pular ele também).
2. Em cada `catch`, além do log, chamar
   `NotificationService.createNotification(...)` avisando o usuário
   ("Não conseguimos sincronizar sua proposta com o Google Drive/Calendar —
   verifique a conexão em Configurações") com metadata pra CTA linkar direto
   pra `configuracoes` (usa o mesmo padrão já existente de notificações, ex.
   `proposal_accepted` em `ProposalService.ts`).
3. Frontend: no `p/[slug].vue` e no download manual de PDF, isso não muda
   nada pro cliente final (ele sempre recebe o PDF, gerado local ou via
   Drive) — o aviso é só pro dono da proposta (freelancer), não pro cliente
   que está aceitando.

---

## 3. Critérios de aceite (consolidado) — status

- [x] Pular o setup grava `setupWizardSkippedAt` e o wizard só reaparece
      depois de 24h (ou ao completar). — `setup-wizard.post.ts`, `SetupWizardModal.vue`, `OnboardingController.vue`.
- [x] Botão "Refazer configuração inicial" existe em Configurações e abre o
      mesmo `SetupWizardModal` via estado compartilhado (`useOnboarding`).
- [x] `googleIntegration.grantedScopes` é gravado no callback (com
      `include_granted_scopes: true`) e usado via `hasGoogleScope()` em
      `qstash.post.ts` e `pdf.get.ts` no lugar de só `refreshToken`.
      `connect.get.ts` aceita `?feature=drive|calendar` pra conectar
      separadamente; Configurações mostra status/CTA por escopo.
- [x] Login (`google.get.ts`) não sobrescreve mais `accessToken`/`refreshToken`
      de integração (só sincroniza `email`).
- [x] Geração de PDF continua funcionando sem Drive (comportamento já
      existente, confirmado e ajustado pra checar escopo em vez de token).
- [x] Falha de Drive na automação pós-aceite não impede mais a criação do
      evento de Calendar (blocos independentes em `handleProposalAccepted`).
- [x] Usuário recebe notificação in-app (`google_sync_failed`) quando a
      sincronização com Drive/Calendar falha, com CTA "Ir para Integrações".
- [x] `disconnect.post.ts` limpa todos os campos de pasta (`driveFolderId`,
      `driveProposalsFolderId`, `driveReportsFolderId`) e `grantedScopes`.
- [x] `credits.patch.ts` valida input (`throwIfInvalid`/`validate.ts`) e usa
      `$inc`/`$set` atômico com guarda `$gte` pra remoção.

### Achado extra corrigido durante a implementação
`disconnectGoogle()` e `isDisconnecting` eram referenciados no template de
`configuracoes/index.vue` mas **não existiam no `<script setup>`** — o botão
"Desconectar" nunca funcionou (bug pré-existente, fora do escopo original do
relatório). Implementado agora junto com a divisão Calendar/Drive.

### Pendências conscientes (não bloqueantes)
- Desconexão ainda é global (desconecta Calendar+Drive juntos mesmo clicando
  em um card só) — desconexão por escopo individual ficou fora desta rodada.
- Não rodei typecheck/build (`npm run build` / `vue-tsc`) nem testes após as
  mudanças — recomendo rodar antes de deployar.

## 4. Priorização

| Prioridade | Itens |
|---|---|
| **Fazer já** (bugs ativos/regressão) | 1 (loop wizard), 2 (login sobrescreve token), 3 (credits), 4 (nome campo) |
| **Curto prazo** (novo escopo, depende dos acima) | A (skip 24h — mesma mudança do item 1/4), E (fallback + notificação), 5 (disconnect limpar campos) |
| **Médio prazo** (mudança de modelo de dados/UI maior) | C (`grantedScopes` + conexão separada Drive/Calendar), B (botão refazer setup) |
| **Sem ação necessária** | D (fallback de PDF sem Drive já existe e funciona) |
