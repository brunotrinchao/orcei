# Design Doc: OrçaFreela - Estrutura Base e Schemas
Data: 2026-05-12
Status: Aprovado

## 1. Visão Geral
O OrçaFreela é um Micro-SaaS para freelancers focado em conversão de orçamentos mobile-first. Este documento detalha a estrutura inicial de dados e arquitetura do sistema usando Nuxt 3 e MongoDB.

## 2. Arquitetura do Sistema
Adotaremos uma abordagem **Server-First** para segurança, com separação clara entre lógica de negócio e interface.

### Estrutura de Diretórios
- `server/models/`: Definições de Schemas Mongoose.
- `server/services/`: Lógica de negócio (acesso ao DB, cálculos, validações).
- `server/api/`: Endpoints da API Nitro.
- `server/utils/`: Utilitários globais do backend (ex: tratamento de erros).
- `types/`: Tipagens TypeScript compartilhadas/DTOs.
- `composables/`: Lógica de estado e chamadas de API no frontend.

## 3. Modelo de Dados (MongoDB/Mongoose)

### User
- `name`: String
- `email`: String (único)
- `brandConfig`: { logoUrl: String, primaryColor: String }
- `stripeCustomerId`: String
- `subscriptionPlan`: Enum ['free', 'starter', 'premium']
- `creditsBalance`: Number
- `defaultSettings`: { defaultValidityDays: Number, showDiscounts: Boolean }

### Service (Catálogo)
- `freelancerId`: Ref(User)
- `name`: String
- `description`: String
- `basePrice`: Number
- `billingType`: Enum ['hour', 'fixed']

### Proposal (O Core)
- `freelancerId`: Ref(User)
- `client`: { name: String, email: String, phone: String }
- `slug`: String (único, para URL pública)
- `status`: Enum ['draft', 'pending', 'accepted', 'expired']
- `expiresAt`: Date
- `items`: Array de Snapshot (nome, preço, quantidade, desconto)
- `upsellItems`: Array de Snapshot (itens opcionais)
- `globalDiscount`: Number
- `totals`: { subtotal: Number, discount: Number, final: Number }
- `logs`: Array de { event: String, ip: String, timestamp: Date }

### Comment
- `proposalId`: Ref(Proposal)
- `author`: Enum ['freelancer', 'client']
- `text`: String
- `createdAt`: Date

## 4. Decisões Técnicas
- **Snapshots:** Os itens de uma proposta são cópias dos serviços no momento da criação para evitar que alterações futuras no catálogo alterem orçamentos já enviados.
- **Créditos:** A publicação de uma proposta consome 1 crédito. O controle será feito via Middleware no Nitro.
- **Segurança:** Todas as mutações no backend validam a propriedade do recurso (User ID).

## 5. Próximos Passos
1. Implementar Schemas com Mongoose e TypeScript.
2. Configurar conexão centralizada com MongoDB no Nitro.
3. Criar os primeiros Services de lógica de negócio.
