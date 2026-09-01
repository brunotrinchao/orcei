<script setup lang="ts">
import { Home, FileText, Plus, Users, Settings } from 'lucide-vue-next'

const route = useRoute()

const menuItems = [
  { label: 'Início', path: '/dashboard', icon: Home },
  { label: 'Orçamento', path: '/orcamentos', icon: FileText, exact: true },
  { label: 'Novo', path: '/orcamentos?new=true', icon: Plus, isPrimary: true },
  { label: 'Clientes', path: '/clientes', icon: Users },
  { label: 'Ajustes', path: '/configuracoes', icon: Settings },
]

const isCurrentRoute = (path: string, exact?: boolean) => {
  if (path.includes('?')) {
    // Para a rota do FAB que possui query parameter
    return false // O FAB nunca fica em estado "ativo" fixo
  }
  if (exact) {
    return route.path === path
  }
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <nav
    aria-label="Navegação principal mobile"
    class="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom,0px)]"
  >
    <ul class="flex items-center justify-around h-16 px-2">
      <li v-for="item in menuItems" :key="item.path" class="flex-1 flex justify-center h-full relative">
        <NuxtLink
          :to="item.path"
          class="group flex flex-col items-center justify-center w-full h-full gap-1 outline-none transition-all duration-200"
          :class="{
            'text-blue-600': isCurrentRoute(item.path, item.exact) && !item.isPrimary,
            'text-gray-400 hover:text-gray-900': !isCurrentRoute(item.path, item.exact) && !item.isPrimary
          }"
          :aria-current="isCurrentRoute(item.path, item.exact) ? 'page' : undefined"
        >
          <!-- Aba em Destaque (FAB) -->
          <div 
            v-if="item.isPrimary" 
            class="absolute -top-6 flex flex-col items-center justify-center"
          >
            <div class="flex items-center justify-center w-14 h-14 bg-brand text-white rounded-full active:scale-95 transition-transform duration-200 ring-4 ring-white dark:ring-gray-950">
              <component :is="item.icon" class="w-6 h-6" aria-hidden="true" />
            </div>
            <span class="text-[9px] font-bold tracking-wide mt-1 text-gray-500">{{ item.label }}</span>
          </div>

          <!-- Abas Normais -->
          <template v-else>
            <component 
              :is="item.icon" 
              class="w-5 h-5 active:scale-90 transition-transform duration-200" 
              aria-hidden="true" 
            />
            <span class="text-[9px] font-bold tracking-wide transition-colors">
              {{ item.label }}
            </span>
          </template>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
