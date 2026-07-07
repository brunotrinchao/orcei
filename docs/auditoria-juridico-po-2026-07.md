# Auditoria — Itens para time Jurídico / PO (não implementáveis via código nesta rodada)

Gerado a partir da auditoria de segurança/LGPD/legal de 2026-07. Itens abaixo exigem decisão de
negócio/jurídica antes de qualquer mudança técnica — deliberadamente não implementados nesta rodada.

## 1. Validade jurídica do "aceite" de proposta

**Onde:** `acceptProposal()` em `server/services/ProposalService.ts:273`, chamado por
`server/api/proposals/public/accept.post.ts`.

**Situação atual:** aceite é só um clique de botão que muda `status` para `ACCEPTED`. Não há
captura de IP, user-agent, timestamp de aceite nem hash do conteúdo (`contractText`/
`termsAndConditions`) aceito naquele momento. IP/user-agent só são coletados em `views`
(visualização), não no aceite.

**Risco:** em disputa, fica mais difícil comprovar o que exatamente o cliente aceitou e quando —
reduz força probatória como assinatura eletrônica simples (MP 2.200-2/2001, Lei 14.063/2020).

**Pergunta para jurídico:** qual nível de robustez é necessário?
- Mínimo: gravar IP + timestamp + hash SHA-256 do `contractText`/`termsAndConditions` no momento
  do aceite (mudança técnica pequena, ~1 endpoint).
- Intermediário: gravar também geolocalização aproximada, snapshot completo do HTML aceito.
- Avançado: integrar certificado digital / provedor de assinatura eletrônica qualificada
  (DocuSign, Clicksign etc.) — mudança de arquitetura maior.

Decisão de **qual nível adotar** é jurídica, não técnica. Aguardando definição para implementar.

## 2. Cláusula de "sem reembolso" no contrato/termos padrão

**Onde:** `defaultContractTemplate` (Cláusula 7ª — Rescisão) e `defaultTermsAndConditions`
(item 5 — Cancelamento e Rescisão) em `server/models/Profile.ts:59-110`. Esses textos são usados
como padrão para **todos** os freelancers que usam a plataforma (editáveis por eles, mas nascem
com esse texto).

**Trecho relevante:**
> "Em caso de rescisão por iniciativa do Contratante sem justa causa, os valores já pagos a
> título de sinal ou setup não serão devolvidos."
> "Em caso de desistência por parte do cliente após o aceite e início dos trabalhos, os valores
> já pagos referentes a etapas concluídas ou horas já trabalhadas não serão reembolsados."

**Risco:** pode conflitar com CDC Art. 49 (direito de arrependimento em 7 dias p/ contratação fora
do estabelecimento comercial, se aplicável ao caso) e Art. 51 (cláusulas abusivas), dependendo do
contexto de uso (B2C vs B2B, local da contratação). Como é um freelancer contratando serviço para
cliente final, a análise de aplicabilidade do CDC varia caso a caso.

**Pedido:** revisão jurídica do texto-padrão para adequação ao CDC onde aplicável, considerando
que é usado em escala (milhares de freelancers/clientes).

## 3. "Créditos vitalícios" sem política de reembolso/cancelamento documentada

**Onde:** `app/pages/planos/index.vue` — página de planos, menciona "créditos vitalícios" como
argumento de venda.

**Risco:** não há página/documento público de política de reembolso ou cancelamento para essa
oferta. Em caso de descontinuação do produto, encerramento de conta, ou disputa sobre o que
"vitalício" significa na prática (vitalício da conta? da empresa? sujeito a Termos de Uso
poderem mudar?), não há texto de referência.

**Pedido:** decisão de negócio + criação de página de política de reembolso/cancelamento
(pode ser seção nos Termos de Uso existentes em `app/pages/terms.vue`).

---

## Notas de itens técnicos simplificados/deferidos nesta rodada (contexto para o PO)

- **Purga de `Profile` após soft-delete (90 dias):** campo `purgeScheduledAt` já é calculado e
  gravado em `server/api/profile/index.delete.ts` no momento da exclusão da conta. **Não existe
  ainda** um cron/job que efetivamente execute o hard-delete do `Profile` após esse prazo — hoje
  é só a data agendada, sem processo automático de purga. Recomenda-se criar job
  (`hyperf`/queue-equivalente no stack Nuxt seria um endpoint agendado via QStash/cron) para
  rodar periodicamente e hard-deletar perfis com `purgeScheduledAt` no passado. Nota: os dados de
  `Client`/`Proposal`/`CatalogItem`/`Event`/`Counter` já são hard-deletados imediatamente na
  exclusão de conta — só o registro `Profile` fica em soft-delete (mantido para auditoria).
- **Categorias de cookie-consent (analytics vs marketing):** o plano original previa separar
  consentimento em categorias (necessário/analytics/marketing). Na prática, o código hoje só tem
  **uma** categoria opcional real (GA/GTM/heatmap), sem tracking de marketing separado — criar
  uma UI de 3 categorias seria especular sobre algo que não existe no sistema. Se o time de
  marketing vier a implementar pixels/tracking de marketing no futuro, revisitar esse ponto para
  separar consentimento adequadamente.
