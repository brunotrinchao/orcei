# OrçaFreela Implementation Plan: Autenticação e Perfil (COMPLETO)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema de autenticação via nuxt-auth-utils e a vinculação automática com a coleção de Perfil.

**Architecture:** Separação entre Identidade (OAuth) e Negócio (Profiles). Integração via `nuxt-auth-utils`.

**Tech Stack:** Nuxt 3, nuxt-auth-utils, MongoDB, Stripe (Customer sync).

---

### Task 1: Instalação e Renomeação de Modelos

**Files:**
- Modify: `package.json`
- Rename: `server/models/User.ts` -> `server/models/Profile.ts`
- Modify: `server/models/Profile.ts`

- [x] **Step 1: Instalar dependências de Autenticação**
Run: `npm install nuxt-auth-utils stripe`

- [x] **Step 2: Renomear User para Profile**
Run: `mv server/models/User.ts server/models/Profile.ts`

- [x] **Step 3: Ajustar Schema de Profile**
Adicionar campo `userId` (string do OAuth) e campos de Stripe.
`server/models/Profile.ts`:
```typescript
import { Schema, model } from 'mongoose'

const profileSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  brandConfig: {
    logoUrl: String,
    primaryColor: { type: String, default: '#3B82F6' }
  },
  creditsBalance: { type: Number, default: 1 },
  subscriptionPlan: { type: String, enum: ['free', 'starter', 'premium'], default: 'free' },
  stripeCustomerId: String,
  stripeSubscriptionId: String
}, { timestamps: true })

export const Profile = model('Profile', profileSchema)
```

- [x] **Step 4: Commit**
Run: `git add . && git commit -m "refactor: rename User to Profile and add userId/stripe fields"`

---

### Task 2: Configuração do Autenticação no Nuxt

**Files:**
- Create: `server/api/auth/google.get.ts`
- Create: `server/api/auth/logout.post.ts`
- Modify: `nuxt.config.ts`
- Modify: `.env`

- [x] **Step 1: Adicionar segredos ao .env**
Configurado segredos para Google OAuth e Stripe.

- [x] **Step 2: Configurar o Handler de OAuth Google**
`server/api/auth/google.get.ts`:
Implementado usando `defineOAuthGoogleEventHandler`.

- [x] **Step 3: Registrar o módulo no Nuxt**
`nuxt.config.ts`:
Adicionado `nuxt-auth-utils` aos módulos.

- [x] **Step 4: Commit**
Run: `git add . && git commit -m "feat: configure nuxt-auth-utils with google provider"`

---

### Task 3: Criação Automática de Perfil e Stripe Customer

**Files:**
- Modify: `server/api/auth/google.get.ts`
- Create: `server/services/ProfileService.ts`

- [x] **Step 1: Criar ProfileService com integração Stripe**
`server/services/ProfileService.ts`:
Lógica para buscar perfil e criar novo no MongoDB + Stripe Customer.

- [x] **Step 2: Chamar ProfileService no callback do Google**
`server/api/auth/google.get.ts`:
Garante que o perfil existe antes de completar o login.

- [x] **Step 3: Commit**
Run: `git add . && git commit -m "feat: auto-create profile and stripe customer on sign in"`
