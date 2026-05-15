# Orcei Phase 1: Fundação & Identidade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Strengthen the application core by updating data models, componentizing the UI, and ensuring a secure, consistent user experience with "Orçamento" terminology.

**Architecture:** Update Mongoose schemas for enhanced profiles and clients. Refactor UI components for reuse and consistency. Implement global auth middleware and logout redirects.

**Tech Stack:** Nuxt 3, TypeScript, Mongoose, Tailwind CSS.

---

### Task 1: Refine Data Models (Profile, Client, Catalog)

**Files:**
- Modify: `server/models/Profile.ts`
- Modify: `server/models/Client.ts`
- Modify: `server/models/CatalogItem.ts`

- [ ] **Step 1: Update Profile Schema**
Add company data, mandatory address fields, and social media.
```typescript
// server/models/Profile.ts
// Add company fields and update address validation
company: {
  taxId: { type: String, required: true }, // CNPJ
  legalName: { type: String, required: true }, // Razão Social
  tradeName: { type: String, required: true } // Nome Fantasia
},
// Ensure address fields are required
address: {
  street: { type: String, required: true },
  neighborhood: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true }
}
```

- [ ] **Step 2: Update Client Schema**
Add notes and ensure phone is WhatsApp friendly.
```typescript
// server/models/Client.ts
// Add notes field if not present, and full address requirement
notes: String,
address: {
  street: { type: String, required: true },
  neighborhood: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: String, required: true }
}
```

- [ ] **Step 3: Update CatalogItem Schema**
Ensure type, SKU, and unit are handled.
```typescript
// server/models/CatalogItem.ts
// Ensure unit has common defaults and sku is optional
unit: { type: String, default: "UN" }, // UN, KG, CM, ML, H, DIA, MES
sku: String,
imageUrl: String
```

- [ ] **Step 4: Commit**
```bash
git add server/models/*.ts
git commit -m "refactor(models): update Profile, Client and CatalogItem schemas with required fields"
```

---

### Task 2: UI Componentization (Table, Modal, Masked Inputs)

**Files:**
- Create: `app/components/ui/BaseTable.vue`
- Create: `app/components/ui/BaseBadge.vue`
- Modify: `app/components/ui/BaseInput.vue`

- [ ] **Step 1: Create BaseTable with Pagination**
```vue
<!-- app/components/ui/BaseTable.vue -->
<template>
  <div class="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
    <table class="w-full text-left">
      <thead class="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <tr>
          <slot name="header"></slot>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-50">
        <slot name="body"></slot>
      </tbody>
    </table>
    <div v-if="totalPages > 1" class="p-4 border-t border-gray-50 flex items-center justify-between">
      <BasePagination :current-page="currentPage" :total-pages="totalPages" @change="$emit("page-change", $event)" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update BaseInput with Masking Support**
Use a library like `v-mask` or handle simple masking logic for CEP, CNPJ, and Phone.
```vue
<!-- app/components/ui/BaseInput.vue -->
<script setup lang="ts">
// Add mask prop and directive/logic integration
defineProps<{
  label?: string
  mask?: string
  // ...
}>()
</script>
```

- [ ] **Step 3: Commit**
```bash
git add app/components/ui/*
git commit -m "feat(ui): add BaseTable and enhance BaseInput with masking support"
```

---

### Task 3: Security & Session Management (Logout Fix)

**Files:**
- Modify: `middleware/auth.global.ts`
- Modify: `app/layouts/default.vue`
- Modify: `server/api/auth/logout.post.ts`

- [ ] **Step 1: Strict Auth Middleware**
```typescript
// middleware/auth.global.ts
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()
  if (!loggedIn.value && to.path.startsWith("/dashboard")) {
    return navigateTo("/auth/login")
  }
})
```

- [ ] **Step 2: Fix Logout Redirect**
```vue
<!-- app/layouts/default.vue or where logout happens -->
<script setup>
const { clear } = useUserSession()
const handleLogout = async () => {
  await clear()
  await $fetch("/api/auth/logout", { method: "POST" })
  navigateTo("/")
}
</script>
```

- [ ] **Step 3: Commit**
```bash
git add middleware/auth.global.ts app/layouts/default.vue
git commit -m "fix(auth): ensure strict dashboard protection and correct logout redirect"
```

---

### Task 4: Global Renaming (Proposta -> Orçamento)

**Files:**
- Bulk Replace: `app/**/*.vue`
- Bulk Replace: `server/**/*.ts`

- [ ] **Step 1: Replace UI labels**
Find "Proposta" and replace with "Orçamento" in labels, headings, and menus.
- [ ] **Step 2: Replace navigation/route names if applicable**
Keep API paths for now to avoid breaking existing integrations, or update if safe.
- [ ] **Step 3: Commit**
```bash
git commit -m "style: rename Proposta to Orçamento across the application"
```
