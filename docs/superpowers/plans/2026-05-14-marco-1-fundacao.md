# Marco 1: Fundação e UI Kit Radix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implementar o design system baseado em Radix Vue, expandir o modelo de Perfil e reforçar a segurança de autenticação.

**Architecture:** Componentes atômicos em `app/components/ui/` usando Lucide Icons e Radix Vue. Atualização de Schema Mongoose com validação obrigatória de endereço.

**Tech Stack:** Nuxt 3, Radix Vue, Lucide Vue Next, Maska, Mongoose.

---

### Task 1: Configuração e Dependências

**Files:**
- Modify: `package.json`
- Modify: `nuxt.config.ts`

- [x] **Step 1: Registrar plugins e módulos no Nuxt**
- [x] **Step 2: Commit inicial de dependências**

---

### Task 2: UI Kit - Primitivas de Formulário

**Files:**
- Create: `app/components/ui/BaseButton.vue`
- Create: `app/components/ui/BaseInput.vue`
- Create: `app/components/ui/BaseLabel.vue`
- Create: `app/components/ui/BaseCheckbox.vue`

- [x] **Step 1: Implementar BaseButton com variantes Orcei**
- [x] **Step 2: Implementar BaseInput com suporte a Maska**
- [x] **Step 3: Commit UI Kit Parte 1**

---

### Task 3: Expansão do Modelo de Perfil

**Files:**
- Modify: `server/models/Profile.ts`
- Modify: `types/index.ts`
- Modify: `server/api/profile/index.put.ts`

- [x] **Step 1: Atualizar Profile Schema com novos campos e obrigatoriedade**
- [x] **Step 2: Atualizar tipos DTO em `types/index.ts`**
- [x] **Step 3: Commit Perfil**

---

### Task 4: Segurança e Middleware

**Files:**
- Create: `app/middleware/auth.global.ts`
- Modify: `server/api/auth/logout.post.ts`
- Modify: `app/layouts/default.vue`

- [x] **Step 1: Criar middleware global de autenticação**
- [x] **Step 2: Corrigir redirecionamento de Logout**
- [x] **Step 3: Commit Segurança**
