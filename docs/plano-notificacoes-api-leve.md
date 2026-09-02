# Plano — Mensagens de notificação estruturadas (versão leve)

## Contexto / Problema
- Backend dispara erros com `statusMessage` livre (texto solto); front adivinha variante via heurística de palavras em `useAlerts.notify()` ("Salvando..." → info, mensagens ambíguas → tipo errado).
- Mensagens de erro duplicadas entre backend (`statusMessage`) e front (`notify('Erro', ...)`), copy inconsistente, 23 arquivos com textos repetidos.

## Decisão
**NÃO** migrar toda mensagem p/ API (custo alto, feedback de sucesso depende de round-trip). **SIM**: padronizar só os **erros** com `code` estruturado + **catálogo único de mensagens** no front. Sucesso continua local (já é consistente).

## Contrato (erros apenas)

**Backend** — `createError` passa a carregar `code` (estável, curto, uppercase) + `message` opcional (descrição detalhada):
```ts
throw createError({
  statusCode: 422,
  statusMessage: 'Cliente precisa aceitar antes de assinar',
  data: { code: 'PROPOSAL_ACCEPT_REQUIRED', message: 'O cliente precisa aceitar o orçamento antes de solicitar assinatura.' }
})
```
- `code` = chave do catálogo no front.
- `data.message` opcional: sobrescreve catálogo quando precisa de contexto dinâmico (nomes, valores).

**Respostas de sucesso**: inalteradas (sem toast/acoplamento UI).

## Implementação

### 1. Backend — helper único de erro
- **Novo `server/utils/api-error.ts`**:
  - `apiError(statusCode, code, title, message?)` → `createError({ statusCode, statusMessage: title, data: { code, message } })`
- **Tipar `code`** em `server/types/api.ts` (novo): união de códigos conhecidos + `string` p/ extensão.
- **Migrar endpoints mais usados** (só os que hoje têm `statusMessage`):
  - `proposals`: `[id]/renew.post.ts` (PROPOSAL_ACCEPTED_RENEW, PROPOSAL_NO_EMAIL), `[id].put.ts`, `[id].delete.ts`, `index.post.ts`, `[id]/signature.post.ts` (PROPOSAL_ACCEPT_REQUIRED)
  - `clients`, `catalog`, `profile/setup-wizard`, `integrations/google/*`
  - Demais: **opcional**, feito por demanda (helper novo não quebra nada existente).

### 2. Front — catálogo único + helper
- **Novo `app/utils/apiErrors.ts`**:
  - `MESSAGE_CATALOG: Record<string, { title: string; type: 'success'|'error'|'warning'|'info' }>`
    - ex: `PROPOSAL_ACCEPT_REQUIRED → { title: 'Aceite pendente', type: 'warning' }`
  - `showApiError(err, fallback?)`: lê `e.data?.code` → catálogo → `useToast().show({ variant: type, title, description: e.data?.message || fallback })`; sem `code` → fallback genérico (comportamento atual).
- **Atualizar `parseApiErrors`** (onde existir) p/ devolver `{ title, description, type }` do catálogo — zero quebra em chamadas que o usam.
- **Migrar `try/catch` dos 13 notifys de `useOrcamentosPage`** como piloto:
  - antes: `notify('Erro', e.data?.statusMessage || '...')`
  - depois: `showApiError(e, 'Não foi possível concluir a ação')`
  - Sucesso: **mantém** `notify('Sucesso', ...)` local (sem mudança).

### 3. Fora de escopo (explícito)
- Toast em payload de sucesso; mudança de shape de respostas; migração de mensagens de sucesso p/ backend; plugins/interceptors globais.

## Verificação
1. Erro com `code` → 1 toast variante correta (teste manual: assinar em rascunho → warning "Aceite pendente").
2. Erro sem `code` (rede/legado) → fallback genérico, sem quebra.
3. `notify('Sucesso')` em orçamentos permanece funcionando idêntico.
4. `npx vitest run` verde (31+); build limpo.
5. Grep: `statusMessage` residual nos endpoints migrados deve zerar; `notify('Erro'` migra p/ `showApiError`.

## Arquivos
- Novo: `server/utils/api-error.ts`, `server/types/api.ts`, `app/utils/apiErrors.ts`
- Editado: endpoints acima (códigos), `useOrcamentosPage.ts` (piloto), `parseApiErrors` localização/atualização
- Sem mudanças em: `useAlerts.ts`, `useToast.ts`, contrato REST, 20 dos 23 arquivos com `notify`