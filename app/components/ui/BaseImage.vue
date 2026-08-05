<script setup lang="ts">
import { ref, watch } from 'vue'
import { Loader2, ImageOff } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  src?: string | null
  alt?: string
  imgClass?: string
  containerClass?: string
  loading?: 'lazy' | 'eager'
}>(), {
  src: '',
  alt: '',
  imgClass: 'w-full h-full object-cover',
  containerClass: 'relative overflow-hidden flex items-center justify-center',
  loading: 'lazy'
})

const isLoading = ref(true)
const hasError = ref(false)

watch(() => props.src, (newSrc) => {
  if (newSrc) {
    isLoading.value = true
    hasError.value = false
  } else {
    isLoading.value = false
  }
}, { immediate: true })

function handleLoad() {
  isLoading.value = false
}

function handleError() {
  isLoading.value = false
  hasError.value = true
}
</script>

<template>
  <div :class="[containerClass, 'relative']">
    <!-- Ícone de Loading com Spinner e Gradiente Suave -->
    <div
      v-if="isLoading && src"
      class="absolute inset-0 z-10 flex items-center justify-center bg-gray-100 dark:bg-slate-800/90 animate-pulse transition-opacity duration-200"
    >
      <Loader2 class="w-4 h-4 text-blue-500 animate-spin shrink-0" />
    </div>

    <!-- Imagem Real com Transição Suave ao Carregar -->
    <img
      v-if="src && !hasError"
      :src="src"
      :alt="alt"
      :loading="loading"
      :class="[imgClass, isLoading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300']"
      @load="handleLoad"
      @error="handleError"
    />

    <!-- Fallback em caso de erro -->
    <div v-else-if="hasError" class="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-slate-800 text-gray-400">
      <ImageOff class="w-4 h-4" />
    </div>

    <!-- Slot caso a imagem não exista -->
    <slot v-else-if="!src" />
  </div>
</template>
