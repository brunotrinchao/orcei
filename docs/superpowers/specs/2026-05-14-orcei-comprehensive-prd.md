# PRD - Orcei: Ecossistema de Gestão Comercial

## 1. Visão Geral
O **Orcei** é um SaaS para freelancers e pequenas empresas automatizarem o ciclo de vendas. O sistema centraliza a gestão de clientes, catálogos de produtos/serviços, criação de orçamentos profissionais e organização de agenda, com inteligência analítica via IA.

## 2. Personas
- **Freelancers/Autônomos**: Precisam de rapidez para enviar propostas e controle de recebimentos.
- **Pequenas Empresas**: Precisam de organização de catálogo, agenda e relatórios de faturamento.

## 3. Requisitos Funcionais

### 3.1. Configurações & Perfil
- **Dados da Empresa**: Obrigatórios: CNPJ, Razão Social, Nome Fantasia.
- **Endereço**: Obrigatórios: CEP, Rua, Bairro, Cidade, Estado (UF).
- **Contatos**: 
  - Telefones com opção "Marcar como WhatsApp".
  - Redes Sociais: Instagram, YouTube.
- **Regras de Negócio**: Configuração de parcelamento para cartão e desconto para pagamento à vista.

### 3.2. Clientes
- **Cadastro**: Nome, CPF/CNPJ, Telefone (WhatsApp toggle), e-mail, endereço completo, observações.
- **Listagem**: Filtros por nome/documento.

### 3.3. Catálogo (Produtos/Serviços)
- **Tipo**: Produto ou Serviço.
- **Dados**: Nome, Preço (opcional), Unidade (UN, KG, CM, ML, etc), SKU/Código (opcional), Descrição, Imagem (Upload Cloudinary).
- **IA**: Geração de descrição curta baseada nos atributos técnicos fornecidos.
- **Listagem**: Filtros para facilitar a busca.

### 3.4. Orçamentos (Anteriormente Propostas)
- **Identificação**: Código sequencial no formato `#ORC-ANO-SEQUENCIAL` (Ex: #ORC-2026-001).
- **Financeiro**: Adição de acréscimo ou desconto no total.
- **Envio**:
  - **Automático**: Via e-mail (Resend).
  - **Manual**: Apenas gera o registro; botão de envio disponível na listagem.
- **Link do Cliente**:
  - Acesso via Token (validade configurável).
  - Ações: Aprovar, Recusar, Pedir Alteração.
  - Botão "Falar no WhatsApp".
  - Rodapé com dados da empresa e link para Termos (Modal).
- **PDF**: Versão estática para impressão/envio manual.

### 3.5. Agenda
- **Componente**: FullCalendar.
- **Integração**: Seleção de orçamento para vincular ao evento.
- **Visualização**: Modal com detalhes do evento, dados da proposta e mapa com endereço do cliente.

### 3.6. Relatórios & Dashboard
- **Dashboard**: Stats de orçamentos (emitidos, aprovados, %, Receita, Ticket Médio).
- **Gráficos**: Faturamento aprovado, Orçamentos por Status, Ranking de Clientes (Receita).
- **Filtros**: Período customizado.
- **IA Analítica**: Análise de tendências, valores e períodos para insights estratégicos.

### 3.7. Planos & Pagamento
- **Modelos**:
  - Mensal: R$ 19,90 (Uso ilimitado).
  - Anual: R$ 199,90 (Uso ilimitado).
  - Avulso: R$ 5,99 (Adição de crédito por orçamento).
- **Área do Usuário**: Histórico de pagamentos (Stripe).

## 4. Requisitos Não Funcionais
- **Layout**: Componentização total (Table com paginação, Modal, BaseButton, BaseInput com máscara, etc).
- **Segurança**: Middleware global para restringir acesso a usuários logados.
- **Auth**: Logout deve redirecionar obrigatoriamente para `/`.

## 5. Arquitetura Técnica
- **Frontend**: Nuxt 3 (Vue), Tailwind CSS.
- **Backend**: Nuxt Server Engine (Nitro), MongoDB (Mongoose).
- **Serviços**: Stripe (Pagamentos), Resend (E-mail), Cloudinary (Imagens), OpenAI/Anthropic (IA).
