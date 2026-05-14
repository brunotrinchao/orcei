# Redesign Minimalista Moderno Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar redesign minimalista moderno (estilo Linear/Apple) com foco em mobile-first, tab bar inferior e cards refinados.

**Architecture:** Refatoração do layout base para suporte a safe-areas mobile e atualização dos componentes do dashboard para a nova identidade visual.

**Tech Stack:** Nuxt 3, Tailwind CSS, Lucide Icons (ou Heroicons existentes).

---

### Task 1: Atualizar Layout Base (app/layouts/default.vue)

**Files:**
- Modify: `app/layouts/default.vue`

- [ ] **Step 1: Refatorar estrutura para suporte a Tab Bar Mobile e Design Clean**

```vue
<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession()
const { data: profile } = useFetch('/api/profile')

const isMenuOpen = ref(false)
const container = ref(null)

onClickOutside(container, () => {
  isMenuOpen.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50/50 pb-20 md:pb-0 font-sans text-gray-900 antialiased">
    <!-- Desktop/Mobile Header -->
    <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-12">
          <NuxtLink to="/" class="text-xl font-bold tracking-tight text-gray-900">orcei</NuxtLink>
          <div v-if="loggedIn" class="hidden md:flex gap-8">
            <NuxtLink to="/dashboard" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Dashboard</NuxtLink>
            <NuxtLink to="/dashboard/services" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Serviços</NuxtLink>
            <NuxtLink to="/dashboard/proposals" class="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors" active-class="text-gray-900">Propostas</NuxtLink>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <template v-if="loggedIn">
            <!-- Credits Display (Refined) -->
            <div class="hidden sm:flex flex-col items-end mr-4">
              <span class="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Créditos</span>
              <span class="text-xs font-semibold text-gray-700">{{ profile?.creditsBalance ?? 0 }}</span>
            </div>

            <!-- User Avatar -->
            <div class="relative" ref="container">
              <button @click="isMenuOpen = !isMenuOpen" class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 hover:ring-2 ring-gray-200 transition-all">
                {{ user?.name?.charAt(0).toUpperCase() }}
              </button>

              <!-- Dropdown (Minimalist) -->
              <div v-if="isMenuOpen" class="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
                <div class="px-4 py-2 border-b border-gray-50">
                  <p class="text-xs font-bold text-gray-900 truncate">{{ user?.name }}</p>
                </div>
                <NuxtLink to="/dashboard/settings" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">Configurações</NuxtLink>
                <NuxtLink to="/dashboard/billing" @click="isMenuOpen = false" class="block px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 transition">Plano</NuxtLink>
                <button @click="clear(); isMenuOpen = false" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50 transition border-t border-gray-50 mt-1">Sair</button>
              </div>
            </div>
          </template>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-6 py-8">
      <slot />
    </main>

    <!-- Mobile Tab Bar (Refined) -->
    <nav v-if="loggedIn" class="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200/50 flex justify-around items-center h-16 px-4 z-50 pb-[safe-area-inset-bottom]">
      <NuxtLink to="/dashboard" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        <span class="text-[9px] font-bold">Início</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/proposals" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <span class="text-[9px] font-bold">Propostas</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/services" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
        <span class="text-[9px] font-bold">Serviços</span>
      </NuxtLink>
      <NuxtLink to="/dashboard/settings" class="flex flex-col items-center gap-1 text-gray-400 py-2" active-class="text-gray-900">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
        <span class="text-[9px] font-bold">Ajustes</span>
      </NuxtLink>
    </nav>
  </div>
</template>
```

- [ ] **Step 2: Verificar renderização no navegador**

- [ ] **Step 3: Commit**

```bash
git add app/layouts/default.vue
git commit -m "feat(ui): update default layout to minimalist modern design"
```

---

### Task 2: Redesign do Dashboard (app/pages/dashboard/index.vue)

**Files:**
- Modify: `app/pages/dashboard/index.vue`

- [ ] **Step 1: Atualizar Header e Cards de Stats**

```vue
<!-- Substituir Seção de Header e Stats -->
<header class="mb-10">
  <h1 class="text-3xl font-bold text-gray-900 tracking-tight mb-1">Olá, {{ user?.name?.split(' ')[0] }}</h1>
  <p class="text-sm text-gray-500 font-medium">Bem-vindo de volta ao seu painel.</p>
</header>

<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
  <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow group">
    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 group-hover:text-blue-500 transition-colors">Créditos</p>
    <p class="text-2xl font-bold text-gray-900 tracking-tight">{{ profile?.creditsBalance ?? 0 }}</p>
  </div>
  <!-- Repetir para Propostas e Serviços com o mesmo estilo -->
  <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)]">
    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Propostas</p>
    <p class="text-2xl font-bold text-gray-900 tracking-tight">{{ stats?.proposalsCount ?? 0 }}</p>
  </div>
  <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)]">
    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Serviços</p>
    <p class="text-2xl font-bold text-gray-900 tracking-tight">{{ stats?.servicesCount ?? 0 }}</p>
  </div>
  <NuxtLink to="/dashboard/proposals" class="bg-gray-900 text-white p-5 rounded-2xl flex flex-col justify-center items-center hover:bg-gray-800 transition active:scale-95 shadow-lg shadow-gray-200">
    <span class="text-xs font-bold uppercase tracking-widest">Nova Proposta</span>
  </NuxtLink>
</div>
```

- [ ] **Step 2: Atualizar Seção de Boas-vindas (Linear Style)**

```vue
<div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)] max-w-2xl">
  <h2 class="text-xl font-bold text-gray-900 tracking-tight mb-4">Novo Orcei</h2>
  <p class="text-gray-500 text-sm leading-relaxed mb-6">Plataforma simplificada para freelancers. Gere propostas profissionais em segundos.</p>
  <div class="space-y-4">
    <div class="flex items-start gap-4">
      <div class="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
        <svg class="w-4 h-4 text-gray-900" ...></svg>
      </div>
      <div>
        <h3 class="text-sm font-bold text-gray-900">IA Integrada</h3>
        <p class="text-xs text-gray-500">Descrições automáticas para seus serviços.</p>
      </div>
    </div>
    <!-- ... outros itens ... -->
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add app/pages/dashboard/index.vue
git commit -m "feat(ui): redesign dashboard page with minimalist modern theme"
```

---

### Task 3: Padronizar Botões e Tipografia Global

**Files:**
- Modify: `app/app.vue` ou `assets/css/main.css` (se existir)

- [ ] **Step 1: Aplicar transições de página no Nuxt**

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  }
})
```

- [ ] **Step 2: Adicionar CSS de transição**

```css
/* app/app.vue style block */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease-out;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
```

- [ ] **Step 3: Commit**

```bash
git add nuxt.config.ts app/app.vue
git commit -m "style: add page transitions and global typography refinements"
```
