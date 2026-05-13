<script setup lang="ts">
const props = defineProps<{
  show: boolean
  title: string
}>()

const emit = defineEmits(['close'])

// Bloquear scroll do body quando aberto
watch(() => props.show, (newVal) => {
  if (process.client) {
    document.body.style.overflow = newVal ? 'hidden' : ''
  }
})

const container = ref(null)
onClickOutside(container, () => emit('close'))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="show" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <Transition
          enter-active-class="duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 translate-y-4"
        >
          <div ref="container" class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <header class="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 class="text-xl font-bold text-gray-900">{{ title }}</h2>
              <button @click="emit('close')" class="p-2 hover:bg-gray-100 rounded-full transition">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </header>
            
            <div class="p-6 overflow-y-auto">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
