# 🚀 Orcei Fácil — SaaS de Propostas Comerciais de Alto Impacto

O **Orcei Fácil** é um SaaS moderno e premium para criação, gerenciamento e aprovação de propostas comerciais e orçamentos em tempo real. Projetado para profissionais autônomos e empresas que buscam agilizar e fechar mais negócios com segurança de dados, alta acessibilidade (WCAG AA), e ferramentas interativas (chat ao vivo, contratos dinâmicos e aprovação rápida).

---

## 🛠️ Stack Tecnológica

- **Core:** Nuxt 4, Vue 3, TypeScript
- **Banco de Dados:** MongoDB & Mongoose (com transações atômicas e soft delete parcial)
- **Design & CSS:** Tailwind CSS (curadoria premium de cores e focus-visible acessível)
- **Gateways & Comunicação:**
  - **Stripe:** Pagamentos e assinaturas recorrentes com preservação de créditos de add-on
  - **Pusher:** WebSockets em tempo real para chat de negociação da proposta
  - **QStash:** Fila de tarefas para automações em segundo plano
  - **Resend:** Disparos de e-mails transacionais e de status de propostas
  - **Puppeteer:** Geração segura de PDFs de propostas

---

## 💻 Configuração Local

### 1. Requisitos
- Node.js `24.x` ou superior
- MongoDB instalado localmente ou Atlas

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto contendo as credenciais de desenvolvimento (consulte `.env.local` para referências de variáveis Stripe, Pusher, QStash, e Resend).

### 3. Instalação e Execução
```bash
# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev
```
O servidor estará rodando em `http://localhost:3000`.

---

## 🧪 Garantia de Qualidade & Testes

Nossa suíte de testes cobre fluxos críticos de integridade comercial, faturamento e webhooks de forma robusta e otimizada.

### 1. Testes Unitários e de Integração (Vitest)
Executa a suíte de testes mockados com cobertura completa para webhooks (Stripe, QStash, Resend) e fluxos de serviços:
```bash
npm test
```

### 2. Testes de Ponta a Ponta / E2E (Playwright)
Executa a suíte de testes de jornadas de usuário integrados em navegadores reais:
```bash
npm run test:e2e
```

### 3. Verificação de Tipagem Estática (Vue-TSC)
Valida a integridade estática dos tipos TypeScript de todos os subcomponentes modulares:
```bash
npx vue-tsc --noEmit
```

---

## 🏗️ Estrutura do Projeto & Refatoração

Durante a auditoria técnica de múltiplos agentes, a plataforma foi estruturada em 4 etapas prioritárias de maturidade técnica:

1. **Segurança Crítica e Integridade Financeira:** Implementação de soft delete parcial de e-mails, prevenção de race condition no débito de créditos via `findOneAndUpdate` atômico, transações Mongoose seguras contra créditos órfãos, e sanitização contra RCE/XSS no gerador de PDFs.
2. **Acessibilidade Premium (WCAG AA):** Foco visível acessível em todos os elementos nativos com `focus-visible`, taxas de contraste superiores a 4.5:1, semântica ARIA para seletores e modal de recusa de proposta acessível ao cliente.
3. **Modularização e Componentização:** Fracionamento de "God Components" monolíticos em composables (`useProposalChat.ts`) e subcomponentes modulares e isolados em `/settings` e `/proposals` (SettingsVisual, ProposalClientScope, etc.).
4. **CI/CD Robusta:** Integração contínua no GitHub Actions (`teste-e-deploy.yml`) executando validações estáticas de tipo TypeScript e execução ativa do Playwright no pipeline de entrega contínua.
