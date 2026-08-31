<script setup lang="ts">
import { ref, watch } from 'vue'
import { Funnel, Check, X } from 'lucide-vue-next'

const props = defineProps<{
  activeFiltersCount?: number
}>()

const emit = defineEmits<{
  (e: 'clear'): void
  (e: 'apply'): void
  (e: 'open'): void
}>()

const isDrawerOpen = ref(false)

watch(isDrawerOpen, (isOpen) => {
  if (isOpen) {
    emit('open')
  }
})

function handleApply() {
  emit('apply')
  isDrawerOpen.value = false
}

function handleClear() {
  emit('clear')
  isDrawerOpen.value = false
}
</script>

<template>
  <div class="w-full">
    <!-- Barra Externa (Desktop & Mobile) -->
    <div class="flex items-center justify-between gap-3 w-full">
      <!-- Desktop: Campo de Busca (Oculto no Mobile) -->
      <div v-if="$slots.search" class="hidden md:block flex-1 min-w-[260px] max-w-md">
        <slot name="search" />
      </div>

      <!-- Mobile Spacer para alinhar botão à direita quando não há busca no desktop -->
      <div v-else class="hidden md:block flex-1" />

      <!-- Ações da Barra: Botão Limpar Rápido + Botão Filtrar -->
      <div class="flex items-center gap-2 ml-auto">
        <!-- Botão Limpar Filtros (Aparece no Desktop se houver filtros ativos) -->
        <BaseButton
          v-if="activeFiltersCount && activeFiltersCount > 0"
          variant="ghost"
          @click="$emit('clear')"
          title="Limpar"
          class="hidden md:inline-flex cursor-pointer"
        >
          <X class="w-4 h-4 mr-1" />
          <span class="text-xs font-bold">Limpar</span>
        </BaseButton>

        <!-- Botão Filtrar (Visível no Desktop se houver outros filtros, ou no Mobile) -->
        <BaseButton
          v-if="$slots.default || $slots.search"
          @click="isDrawerOpen = true"
          variant="secondary"
          :class="['cursor-pointer', !$slots.default ? 'md:hidden' : '']"
        >
          <div class="flex items-center gap-1.5">
            <Funnel class="w-4 h-4" />
            <span>Filtrar</span>
          </div>

          <span
            v-if="activeFiltersCount && activeFiltersCount > 0"
            class="ml-1.5 flex h-5 px-2 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white"
          >
            {{ activeFiltersCount }}
          </span>
        </BaseButton>
      </div>
    </div>

    <!-- Painel de Filtros em Drawer (BaseDrawer) -->
    <BaseDrawer
      v-model:open="isDrawerOpen"
      title="Filtros e Busca"
      size="md"
      position="right"
    >
      <div class="space-y-5 py-2">
        <!-- Campo de Busca no Drawer (EXCLUSIVO PARA MOBILE: md:hidden) -->
        <div v-if="$slots.search" class="md:hidden space-y-2">
          <label class="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
            Buscar
          </label>
          <div class="relative">
            <slot name="search" />
          </div>
        </div>

        <!-- Campos de Filtro Adicionais (slot default) -->
        <div v-if="$slots.default" class="space-y-4 [&>*]:!w-full">
          <slot />
        </div>
      </div>

      <template #footer>
        <div class="flex items-center gap-3 w-full justify-end">
          <BaseButton
            v-if="activeFiltersCount && activeFiltersCount > 0"
            variant="ghost"
            class="flex-1 sm:flex-none cursor-pointer"
            @click="handleClear"
          >
            Limpar
          </BaseButton>
          <BaseButton
            variant="primary"
            class="flex-1 sm:flex-none cursor-pointer"
            @click="handleApply"
          >
            <Check class="w-4 h-4 mr-2" /> Aplicar
          </BaseButton>
        </div>
      </template>
    </BaseDrawer>
  </div>
</template>
