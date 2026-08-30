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
      <BaseButton size="" variant="ghost"
      v-if="activeFiltersCount && activeFiltersCount > 0"
        @click="$emit('clear')">
        <X class="w-4 h-4" />
      </BaseButton>
    </div>

    <!-- Mobile Layout -->
    <div class="md:hidden flex flex-row-reverse">
      <!-- Botão para abrir o Modal de Filtros (largura total) -->
      <BaseButton @click="isDrawerOpen = true" size="sm" class="flex flex-end" variant="secondary">
        <div class="flex flex-row items-center">
          <SlidersHorizontal class="w-5 h-5 mr-0 sm:mr-2" />
          <span class="hidden sm:inline">Filtrar</span>
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
