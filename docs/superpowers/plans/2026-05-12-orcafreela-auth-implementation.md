# OrçaFreela Implementation Plan: Autenticação e Perfil

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o sistema de autenticação via Auth.js e a vinculação automática com a coleção de Perfil.

**Architecture:** Separação entre Identidade (Auth.js) e Negócio (Profiles). Integração via `authjs-nuxt`.

**Tech Stack:** Nuxt 3, Auth.js, MongoDB Adapter, Resend (para Magic Link).

---

### Task 1: Instalação e Renomeação de Modelos

**Files:**
- Modify: `package.json`
- Rename: `server/models/User.ts` -> `server/models/Profile.ts`
- Modify: `server/models/Profile.ts`

- [ ] **Step 1: Instalar dependências do Auth.js**
Run: `npm install @auth/core @auth/mongodb-adapter authjs-nuxt`

- [ ] **Step 2: Renomear User para Profile**
Run: `mv server/models/User.ts server/models/Profile.ts`

- [ ] **Step 3: Ajustar Schema de Profile**
Adicionar campo `userId` (referência ao Auth.js) e atualizar nome do modelo.
`server/models/Profile.ts`:
```typescript
import { Schema, model } from 'mongoose'

const profileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  brandConfig: {
    logoUrl: String,
    primaryColor: { type: String, default: '#3B82F6' }
  },
  creditsBalance: { type: Number, default: 1 },
  subscriptionPlan: { type: String, enum: ['free', 'starter', 'premium'], default: 'free' }
}, { timestamps: true })

export const Profile = model('Profile', profileSchema)
```

- [ ] **Step 4: Commit**
Run: `git add . && git commit -m "refactor: rename User to Profile and add userId field"`

---

### Task 2: Configuração do Auth.js no Nuxt

**Files:**
- Create: `server/api/auth/[...].ts`
- Modify: `nuxt.config.ts`
- Modify: `.env`

- [ ] **Step 1: Adicionar segredos ao .env**
```bash
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env
echo "AUTH_GOOGLE_ID=seu_id" >> .env
echo "AUTH_GOOGLE_SECRET=seu_secret" >> .env
```

- [ ] **Step 2: Configurar o Handler do Auth.js**
`server/api/auth/[...].ts`:
```typescript
import Google from '@auth/core/providers/google'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import { NuxtAuthHandler } from 'authjs-nuxt'
import mongoose from 'mongoose'

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  adapter: MongoDBAdapter(mongoose.connection.db as any),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
})
```

- [ ] **Step 3: Registrar o módulo no Nuxt**
`nuxt.config.ts`:
```typescript
export default defineNuxtConfig({
  modules: ['authjs-nuxt'],
  // ... resto da config
})
```

- [ ] **Step 4: Commit**
Run: `git add . && git commit -m "feat: configure authjs-nuxt handler and provider"`

---

### Task 3: Criação Automática de Perfil (Callbacks)

**Files:**
- Modify: `server/api/auth/[...].ts`
- Create: `server/services/ProfileService.ts`

- [ ] **Step 1: Criar ProfileService**
`server/services/ProfileService.ts`:
```typescript
import { Profile } from '../models/Profile'

export const ProfileService = {
  async createForUser(user: any) {
    const existing = await Profile.findOne({ userId: user.id })
    if (existing) return existing

    return await Profile.create({
      userId: user.id,
      name: user.name,
      email: user.email,
      creditsBalance: 1, // Default inicial
    })
  }
}
```

- [ ] **Step 2: Adicionar Callback no Auth.js**
`server/api/auth/[...].ts`:
```typescript
// ... imports
import { ProfileService } from '../../services/ProfileService'

export default NuxtAuthHandler({
  // ... config
  callbacks: {
    async signIn({ user }) {
      if (user) {
        await ProfileService.createForUser(user)
      }
      return true
    }
  }
})
```

- [ ] **Step 3: Commit**
Run: `git add . && git commit -m "feat: auto-create profile on sign in"`
