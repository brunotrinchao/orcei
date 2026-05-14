# Expansão de Configurações Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar upload de logo (Base64/120x120), configuração de validade e redesign da página de ajustes.

**Architecture:** Atualização do Schema Mongoose e implementação de processamento de imagem via Canvas no frontend.

**Tech Stack:** Nuxt 3, Mongoose, HTML5 Canvas API.

---

### Task 1: Atualizar Modelo e API (Backend)

**Files:**
- Modify: `server/models/Profile.ts`
- Modify: `server/api/profile/index.put.ts`
- Modify: `types/index.ts`

- [ ] **Step 1: Adicionar defaultValidityDays ao Schema**
- [ ] **Step 2: Adicionar defaultValidityDays ao DTO (types)**
- [ ] **Step 3: Garantir que o campo seja salvo na API PUT**
- [ ] **Step 4: Commit**

---

### Task 2: Implementar Upload de Logo com Resize (Frontend)

**Files:**
- Modify: `app/pages/dashboard/settings.vue`

- [ ] **Step 1: Criar função handleLogoUpload com Canvas Resize (120x120)**
- [ ] **Step 2: Implementar componente visual de upload no template**
- [ ] **Step 3: Adicionar input para defaultValidityDays**
- [ ] **Step 4: Commit**

---

### Task 3: Redesign e Organização da Página

**Files:**
- Modify: `app/pages/dashboard/settings.vue`

- [ ] **Step 1: Reorganizar layout em cards (Identidade, Regras, Modelos)**
- [ ] **Step 2: Polimento visual seguindo o estilo Minimalista Moderno**
- [ ] **Step 3: Validar salvamento e preview da logo**
- [ ] **Step 4: Commit**
