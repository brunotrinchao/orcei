<script setup lang="ts">
import { computed } from 'vue'
import type { Component } from 'vue'

interface Props {
  id?: string
  dataTour?: string
  title?: string
  subtitle?: string
  icon?: Component
  iconBgClass?: string
  iconColorClass?: string,
  noBorder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  id: undefined,
  dataTour: undefined,
  title: undefined,
  subtitle: undefined,
  icon: undefined,
  iconBgClass: 'bg-blue-50 dark:bg-blue-950/50',
  iconColorClass: 'text-blue-600 dark:text-blue-400',
  noBorder: false
})

const borderClass = computed(() => {
  return props.noBorder ? '' : 'p-6 md:p-8 border border-slate-200 dark:border-gray-800'
})
</script>

<template>
  <section
    :id="id"
    :data-tour="dataTour"
    class="bg-white dark:bg-gray-900 rounded-[0.75rem] shadow-sm shadow-slate-200/50 dark:shadow-none scroll-mt-8 transition-colors"
    :class="borderClass"
  >
    <!-- Header da Seção -->
    <div v-if="title || icon || $slots.icon || $slots['header-actions']" class="flex items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <slot name="icon">
          <div
            v-if="icon"
            :class="[
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              iconBgClass
            ]"
          >
            <component :is="icon" :class="['w-5 h-5', iconColorClass]" />
          </div>
        </slot>
        <div v-if="title || subtitle">
          <h2 v-if="title" class="text-xl font-black text-gray-900 dark:text-gray-50 uppercase tracking-tight">
            {{ title }}
          </h2>
          <p v-if="subtitle" class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <!-- Ações do Cabeçalho (opcional) -->
      <div v-if="$slots['header-actions']" class="shrink-0 flex items-center gap-2">
        <slot name="header-actions" />
      </div>
    </div>

    <!-- Conteúdo Principal / Form -->
    <div>
      <slot />
    </div>

    <!-- Rodapé (opcional) -->
    <div v-if="$slots.footer" class="mt-8 pt-6 border-t border-slate-200 dark:border-gray-800">
      <slot name="footer" />
    </div>
  </section>
</template>
