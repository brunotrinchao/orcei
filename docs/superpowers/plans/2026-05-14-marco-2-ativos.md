# Marco 2: Catálogo, Clientes e Cloudinary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar Produtos e Serviços em um Catálogo, implementar Gestão de Clientes e integrar Cloudinary para imagens.

**Architecture:** Novo modelo `CatalogItem` (refatorado de `Service`), novo modelo `Client`. Integração com `@nuxtjs/cloudinary` para uploads e transformações.

**Tech Stack:** Nuxt 3, Cloudinary, Mongoose, Radix Vue, IA Gemini.

---

### Task 1: Configuração do Cloudinary

**Files:**
- Modify: `nuxt.config.ts`
- Modify: `app/pages/dashboard/settings.vue`

- [ ] **Step 1: Registrar módulo e chaves no Nuxt Config**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    // ...
    '@nuxtjs/cloudinary',
  ],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  },
  runtimeConfig: {
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
    // ...
  }
})
```

- [ ] **Step 2: Migrar upload da Logo para Cloudinary**
Refatorar a função `cropLogo` em `settings.vue` para enviar o Canvas para o Cloudinary (via server-side ou assinado) em vez de salvar Base64.

- [ ] **Step 3: Commit Cloudinary**

---

### Task 2: Novo Catálogo Unificado (Refactor Service)

**Files:**
- Create: `server/models/CatalogItem.ts`
- Create: `server/api/catalog/index.get.ts`
- Create: `server/api/catalog/index.post.ts`
- Create: `server/api/catalog/[id].put.ts`
- Modify: `types/index.ts`

- [ ] **Step 1: Implementar Modelo CatalogItem**

```typescript
// server/models/CatalogItem.ts
const catalogItemSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, enum: ['product', 'service'], required: true },
  name: { type: String, required: true },
  description: String,
  price: Number,
  unit: { type: String, default: 'UN' }, // UN, KG, CM, ML, H, DIA, MES
  sku: String,
  imageUrl: String
}, { timestamps: true })
```

- [ ] **Step 2: Atualizar DTOs e criar endpoints de API**

- [ ] **Step 3: Criar script de migração `server/utils/migrate-services.ts`**
Migrar documentos de `Service` para `CatalogItem` como `type: 'service'`.

- [ ] **Step 4: Commit Catálogo**

---

### Task 3: Gestão de Clientes

**Files:**
- Create: `server/models/Client.ts`
- Create: `server/api/clients/index.get.ts`
- Create: `server/api/clients/index.post.ts`
- Create: `app/pages/dashboard/clients/index.vue`

- [ ] **Step 1: Implementar Modelo Client**

```typescript
// server/models/Client.ts
const clientSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true },
  taxId: String, // CPF/CNPJ
  email: { type: String, required: true },
  phone: {
    number: String,
    isWhatsapp: { type: Boolean, default: false }
  },
  address: {
    zip: String,
    street: String,
    number: String,
    neighborhood: String,
    city: String,
    state: String
  },
  notes: String
}, { timestamps: true })
```

- [ ] **Step 2: Criar página de listagem e cadastro de clientes**
Usar o novo UI Kit e componentes Radix.

- [ ] **Step 3: Commit Clientes**

---

### Task 4: UI Kit - Expansão e Polimento

**Files:**
- Create: `app/components/ui/BaseSelect.vue`
- Create: `app/components/ui/BasePagination.vue`
- Create: `app/components/ui/BaseDialog.vue`

- [ ] **Step 1: Implementar BaseSelect (Radix Vue)**

- [ ] **Step 2: Implementar BasePagination (Radix Vue)**

- [ ] **Step 3: Implementar BaseDialog (Radix Vue)**
Substituir o uso do `AppModal.vue` legado pelo `BaseDialog` nas telas de Catálogo e Clientes.

- [ ] **Step 4: Commit UI Kit Parte 2**
