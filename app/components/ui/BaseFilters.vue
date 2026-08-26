<script setup lang="ts">
import { ref } from "vue";
import { SlidersHorizontal, Check, X } from "lucide-vue-next";

const props = defineProps<{
  activeFiltersCount?: number;
}>();

const emit = defineEmits(["clear"]);

const isDrawerOpen = ref(false);
</script>

<template>
  <div class="w-full">
    <!-- Desktop Layout -->
    <div class="hidden md:flex items-center gap-3 w-full flex-wrap">
      <div v-if="$slots.search" class="relative flex-1 min-w-[260px] max-w-md">
        <slot name="search" />
      </div>
      <slot />
      <button
        v-if="activeFiltersCount && activeFiltersCount > 0"
        @click="$emit('clear')"
        class="h-[52px] px-4 flex items-center justify-center gap-2 text-xs font-black text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-800 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50/50 dark:hover:bg-red-950/30 rounded-[0.75rem] uppercase tracking-widest transition-all shadow-sm active:scale-95 shrink-0"
      >
        <X class="w-4 h-4" /> Limpar
      </button>
    </div>

    <!-- Mobile Layout -->
    <div class="md:hidden">
      <!-- Botão para abrir o Modal de Filtros (largura total) -->
      <BaseButton @click="isDrawerOpen = true" class="w-full flex justify-between" variant="outline">
        <div class="flex flex-row items-center">
          <SlidersHorizontal class="w-5 h-5 mr-2" />
          <span class="inline">Filtrar</span>
        </div>
        <span
          v-if="activeFiltersCount && activeFiltersCount > 0"
          class="flex h-6 px-2.5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-black text-white ring-2 ring-white dark:ring-gray-950"
        >
          {{ activeFiltersCount }} ativo{{ activeFiltersCount > 1 ? "s" : "" }}
        </span>
      </BaseButton>
      <!-- Modal de Filtros Mobile -->
      <BaseDialog
        v-model:open="isDrawerOpen"
        title="Buscar e Filtrar"
        size="md"
      >
        <div class="space-y-6 py-2">
          <!-- Campo de Busca no topo do modal mobile -->
          <div v-if="$slots.search" class="space-y-2">
            <label
              class="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-2"
              >Buscar</label
            >
            <div class="relative">
              <slot name="search" />
            </div>
          </div>
          <slot />
        </div>
        <template #footer>
          <div class="flex gap-3 w-full">
            <BaseButton
              v-if="activeFiltersCount && activeFiltersCount > 0"
              variant="outline"
              class="flex-1 w-1/2"
              @click="
                $emit('clear');
                isDrawerOpen = false;
              "
            >
              Limpar
            </BaseButton>
            <BaseButton
              variant="primary"
              class="flex-1 w-1/2"
              @click="isDrawerOpen = false"
            >
              <Check class="w-4 h-4 mr-2" /> Aplicar
            </BaseButton>
          </div>
        </template>
      </BaseDialog>
    </div>
  </div>
</template>
