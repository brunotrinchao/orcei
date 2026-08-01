# Análise Competitiva — Orcei Fácil vs Propoz

**Data:** 01/08/2026
**Fonte concorrente:** https://www.propoz.com.br/ (scraping direto do site, 01/08/2026)
**Fonte Orcei:** código-fonte do repo atual (README.md, AIService.ts, LandingPricing.vue, useCreditPackages.ts, LandingFeatures.vue)

---

## 1. Resumo executivo

Propoz e Orcei Fácil atacam o **mesmo mercado**: orçamentos/propostas comerciais digitais para freelancers e pequenos negócios, com envio por link, aprovação do cliente sem cadastro, e uso de IA. É concorrência direta, não adjacente.

Diferença estrutural mais relevante: **modelo de cobrança**. Propoz é assinatura mensal/anual (SaaS clássico). Orcei é pacote de créditos vitalícios (pay-per-use, nunca expira) — ponto de diferenciação forte a favor do Orcei para freelancer de volume baixo/irregular, mas potencial fraqueza em receita recorrente previsível (MRR) se comparado do lado do negócio.

## 2. Feature a feature

| Feature | Propoz | Orcei Fácil | Observação |
|---|---|---|---|
| Wizard de criação | Sim (4 passos: Projeto/Serviços/Valores/Revisar) | Sim (`AIProposalWizard.vue`, `ProposalStepClient.vue`, `ProposalStepSummary.vue`) | Paridade |
| Link público p/ cliente aprovar/negociar/recusar | Sim | Sim (`app/pages/p/[slug].vue`, modal de recusa acessível) | Paridade |
| Notificação de visualização do cliente | Sim (feature PRO) | Sim (`NotificationCenterDrawer.vue`, `NotificationDetailModal.vue`) | Paridade |
| IA de precificação (faixas mínimo/ideal/premium) | Sim, evidente no wizard (PRO) | Não encontrado componente equivalente de "3 faixas de preço" — IA do Orcei foca em geração de descrição/extração de dados de cliente, não achei sugestão de faixa de preço explícita no AIService.ts lido | **Gap potencial do Orcei** — verificar se existe em outro service antes de assumir ausência total |
| IA generativa (descrição/conteúdo) | Não evidenciado no site | Sim, forte: `AIService.generateDescription` com fallback em cascata Gemini → DeepSeek → Cloudflare/OpenRouter (`server/services/AIService.ts`) | Vantagem Orcei — arquitetura de IA mais robusta e resiliente a falhas de provedor |
| Extração automática de dados do cliente (nome/email/telefone/segmento) a partir de texto livre | Não visto | Sim (`AIService.extractClientInfo`) | Vantagem Orcei — reduz fricção de cadastro manual |
| Contratos com assinatura digital | Sim (NOVO — cláusulas prontas) | Presença de contratos no fluxo (README cita "contratos dinâmicos"), não confirmei assinatura digital eletrônica formal | Investigar paridade real |
| Geração de PDF | Não citado no site | Sim, via Puppeteer (`@sparticuz/chromium`, README) | Vantagem Orcei se Propoz realmente não gera PDF |
| Chat/negociação em tempo real | Não visto | Sim, WebSocket via Pusher (`useProposalChat.ts`) | Vantagem Orcei — Propoz só tem aprovar/negociar/recusar estático, sem chat ao vivo |
| Catálogo de serviços reutilizável | Não visto no site | Sim (`CatalogItemFormDialog.vue`, `app/composables/onboarding/steps/catalogo.ts`) | Vantagem Orcei |
| Dashboard de métricas/funil de conversão | Sim (PRO): conversão, ticket médio, taxa aprovação, enviados | Sim (`app/pages/relatorios/index.vue`, `ReportCard.vue`, `GenerateReportDrawer.vue`) — parece mais orientado a "relatórios" gerados do que funil em tempo real | Paridade aproximada, formato difere |
| Onboarding estruturado | Não visto (login direto) | Sim, wizard 6 passos: Empresa/Endereço/Contatos/Visual/Integrações/Revisão (`SetupWizardModal.vue`) | Vantagem Orcei em ativação/first-run |
| Integrações externas (Google Calendar/Drive) | Não visto | Sim (`server/api/integrations/google/*`) | Vantagem Orcei |
| Acessibilidade (WCAG) | Não mencionado | Sim, WCAG AA declarado e auditado (README) | Vantagem Orcei — diferencial defensável, raro no segmento |
| Cupons/promoções | Não visto | Sim (`app/pages/admin/coupons/index.vue`) | Vantagem Orcei em growth/aquisição |
| Painel admin próprio | Não visto | Sim (`app/pages/admin/*` — settings, users, coupons) | Vantagem Orcei — Propoz parece produto mais enxuto/sem operação B2B visível |

## 3. Pricing

**Propoz:**
- Free: até 3 orçamentos ativos, 5 notificações/mês, sem contrato/IA ilimitada
- Pro: R$ 29/mês (preço beta, de R$ 67,90) — tudo ilimitado
- Pro Anual: R$ 289,90/ano (~R$ 24,16/mês)
- Modelo: assinatura recorrente clássica

**Orcei Fácil:**
- Crédito Avulso: R$ 5,99 (1 crédito = 1 orçamento ou relatório IA)
- Starter: R$ 29,00 / 10 créditos (R$ 2,90/crédito)
- Profissional: R$ 69,00 / 30 créditos (R$ 2,30/crédito) — destaque "Melhor Valor"
- Agência: R$ 149,00 / 100 créditos (R$ 1,49/crédito)
- Créditos vitalícios, sem mensalidade
- Billing via Stripe (`/api/stripe/plans`), preços dinâmicos com fallback estático no código

**Leitura comparativa:**
- P/ freelancer de baixo volume (1-3 propostas/mês): Orcei sai mais barato e sem compromisso (R$ 5,99–29 vs R$ 29/mês fixo do Propoz).
- P/ freelancer de alto volume (30+/mês): Propoz Pro ilimitado (R$ 29–67,90/mês) fica mais barato que qualquer pacote de crédito Orcei se o volume passar de ~15 propostas/mês (ponto de equilíbrio aproximado: pacote Profissional R$69/30 = R$2,30 cada; a partir de ~24 propostas/mês assinatura Propoz Pro já compensa mais).
- Risco de negócio pro Orcei: modelo de crédito não gera MRR previsível — receita depende de recompra constante. Propoz aposta em retenção de assinatura.

## 4. Posicionamento / mensagem

- Propoz: mensagem forte e direta contra "PDF pelo WhatsApp", prova social clara (R$ 2.8M+ gerados, depoimentos com números — "30%→65% aprovação", "+40% faturamento"), FAQ extenso, blog de conteúdo ativo (SEO/aquisição orgânica).
- Orcei: mensagem em torno de "SaaS premium", ênfase técnica em segurança/acessibilidade/IA multi-provider — bom para diferenciação técnica, mas não vi (no código lido) prova social equivalente (depoimentos com números, contador de "R$ X gerados") na landing. **Gap de marketing**: Propoz comunica resultado/ROI de forma muito mais concreta que o que aparenta a landing do Orcei.

## 5. Gaps e riscos a investigar (não confirmados só com leitura de código)

1. Orcei tem "IA de precificação" com faixas sugeridas (min/ideal/premium) equivalente ao Propoz? Não encontrado no AIService.ts lido — pode existir em outro arquivo não revisado. **Ação: confirmar antes de assumir gap real.**
2. Assinatura digital de contrato (juridicamente válida) — Propoz anuncia explicitamente; Orcei menciona "contratos dinâmicos" mas não confirmei fluxo de assinatura formal.
3. Prova social / depoimentos quantificados na landing do Orcei — não encontrados nos componentes lidos (`LandingStats.vue`, `LandingHero.vue` não foram abertos nesta análise — vale checar).
4. Free tier: Propoz tem free permanente (3 orçamentos ativos). Orcei não tem tier grátis recorrente (crédito avulso é pago desde o primeiro uso) — pode ser barreira de entrada maior pro topo de funil.

## 6. Recomendações rápidas

- Adicionar prova social quantificada na landing (números de conversão, valores fechados) — tática comprovada que Propoz usa bem.
- Avaliar oferta híbrida: manter créditos vitalícios, mas adicionar 1 crédito grátis de teste sem cartão (reduzir fricção de topo de funil vs free tier do Propoz).
- Confirmar/expor de forma explícita (se existir) a IA de precificação por faixas — é o gancho de marketing mais forte do Propoz e Orcei já tem infraestrutura de IA multi-provider para sustentar isso.
- Explorar chat ao vivo (Pusher) e catálogo de serviços como diferenciais de marketing — Propoz não tem, e são features fortes já implementadas no Orcei.
