# OrçaFreela Implementation Plan: Estrutura Base e Schemas

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configurar a base técnica do OrçaFreela, incluindo Nuxt 3, conexão MongoDB (Mongoose) e os Schemas principais.

**Architecture:** Abordagem Server-First com separação entre Schemas (models), Lógica de Negócio (services) e Endpoints (api).

**Tech Stack:** Nuxt 3, TypeScript, Mongoose, MongoDB.

---

### Task 1: Inicialização do Projeto Nuxt 3

**Files:**
- Create: `package.json`, `nuxt.config.ts`, `tsconfig.json`
- Create: `.env`

- [x] **Step 1: Inicializar projeto Nuxt**
Run: `npx nuxi@latest init . --force --install`

- [x] **Step 2: Adicionar dependências essenciais**
Run: `npm install mongoose`

- [x] **Step 3: Criar arquivo .env base**
```bash
echo "MONGODB_URI=mongodb://localhost:27017/orcafreela" > .env
```

- [x] **Step 4: Configurar Nuxt para usar TypeScript estrito**
Modificar `nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  typescript: {
    strict: true
  },
  devtools: { enabled: true }
})
```

- [x] **Step 5: Commit inicial**
Run: `git init && git add . && git commit -m "chore: initial nuxt 3 setup"`

---

### Task 2: Conexão MongoDB e Utilitário de Modelagem

**Files:**
- Create: `server/plugins/mongodb.ts`

- [x] **Step 1: Criar plugin Nitro para conexão MongoDB**
```typescript
import mongoose from 'mongoose'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()
  try {
    await mongoose.connect(process.env.MONGODB_URI!)
    console.log('MongoDB connected')
  } catch (e) {
    console.error('MongoDB connection error', e)
  }
})
```

- [x] **Step 2: Verificar inicialização (Log)**
Run: `npm run dev` (verificar se "MongoDB connected" aparece no console).

- [x] **Step 3: Commit**
Run: `git add . && git commit -m "feat: add mongodb connection plugin"`

---

### Task 3: Schema de Usuário (User)

**Files:**
- Create: `server/models/User.ts`
- Create: `types/user.ts`

- [x] **Step 1: Definir Interface DTO**
`types/user.ts`:
```typescript
export interface UserDTO {
  id: string
  name: string
  email: string
  creditsBalance: number
}
```

- [x] **Step 2: Criar Schema Mongoose**
`server/models/User.ts`:
```typescript
import { Schema, model } from 'mongoose'

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  brandConfig: {
    logoUrl: String,
    primaryColor: { type: String, default: '#3B82F6' }
  },
  creditsBalance: { type: Number, default: 1 },
  subscriptionPlan: { type: String, enum: ['free', 'starter', 'premium'], default: 'free' }
}, { timestamps: true })

export const User = model('User', userSchema)
```

- [x] **Step 3: Commit**
Run: `git add . && git commit -m "feat: add User model"`

---

### Task 4: Schema de Catálogo (Service)

**Files:**
- Create: `server/models/Service.ts`

- [x] **Step 1: Criar Schema Mongoose**
`server/models/Service.ts`:
```typescript
import { Schema, model } from 'mongoose'

const serviceSchema = new Schema({
  freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: String,
  basePrice: { type: Number, required: true },
  billingType: { type: String, enum: ['hour', 'fixed'], default: 'fixed' }
}, { timestamps: true })

export const Service = model('Service', serviceSchema)
```

- [x] **Step 2: Commit**
Run: `git add . && git commit -m "feat: add Service model"`

---

### Task 5: Schema de Proposta (Proposal) com Snapshots

**Files:**
- Create: `server/models/Proposal.ts`

- [x] **Step 1: Definir Schema com sub-documents para Snapshots**
`server/models/Proposal.ts`:
```typescript
import { Schema, model } from 'mongoose'

const itemSnapshotSchema = new Schema({
  name: String,
  description: String,
  price: Number,
  quantity: { type: Number, default: 1 },
  discount: {
    value: { type: Number, default: 0 },
    type: { type: String, enum: ['percent', 'fixed'], default: 'percent' }
  }
})

const proposalSchema = new Schema({
  freelancerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  client: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String
  },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: ['draft', 'pending', 'accepted', 'expired'], default: 'draft' },
  items: [itemSnapshotSchema],
  upsellItems: [itemSnapshotSchema],
  totals: {
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    final: { type: Number, default: 0 }
  },
  expiresAt: Date
}, { timestamps: true })

export const Proposal = model('Proposal', proposalSchema)
```

- [x] **Step 2: Commit**
Run: `git add . && git commit -m "feat: add Proposal model with snapshots"`
