<script setup lang="ts">
import { computed, ref, watch, onUnmounted } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { Check, Search, Loader2 } from 'lucide-vue-next'

interface Option {
  label: string
  value: string
}

const props = defineProps<{
  options: Option[]
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  loading?: boolean
  emptyMessage?: string
}>()

const modelValue = defineModel<string>()
const searchItem = defineModel<string>('search')

const internalSearch = ref('')
const isOpen = ref(false)
const containerRef = ref(null)

let debounceTimeout: any

// Initial sync if there is a pre-selected value
watch(() => modelValue.value, (newVal) => {
  if (newVal) {
    const option = props.options.find(o => o.value === newVal)
    if (option && internalSearch.value !== option.label) {
      internalSearch.value = option.label
    }
  } else {
    internalSearch.value = ''
  }
}, { immediate: true })

watch(internalSearch, (val) => {
  if (!val) {
    modelValue.value = ''
  }
  
  clearTimeout(debounceTimeout)
  if (val.length < 2) {
    searchItem.value = val
    return
  }
  
  debounceTimeout = setTimeout(() => {
    searchItem.value = val
  }, 300)
})

onUnmounted(() => {
  clearTimeout(debounceTimeout)
})

const displayValue = computed(() => {
  if (!modelValue.value) return ''
  const option = props.options.find(o => o.value === modelValue.value)
  return option ? option.label : ''
})

onClickOutside(containerRef, () => {
  isOpen.value = false
  if (displayValue.value && internalSearch.value !== displayValue.value) {
    internalSearch.value = displayValue.value
  } else if (!displayValue.value) {
    internalSearch.value = ''
  }
})

const onInputFocus = () => {
  isOpen.value = true
  // If we already have a selected value, selecting all text makes it easier to change
}

const onInput = () => {
  isOpen.value = true
  // If user starts typing, we clear the selected value until they pick a new one
  if (modelValue.value && internalSearch.value !== displayValue.value) {
    modelValue.value = ''
  }
}

const selectOption = (option: Option) => {
  modelValue.value = option.value
  internalSearch.value = option.label
  isOpen.value = false
}
</script>

<template>
  <div class="space-y-2" ref="containerRef">
    <label v-if="label" class="block text-xs font-semibold text-slate-700 dark:text-gray-400 tracking-wide ml-1">
      {{ label }}
    </label>
    
    <div class="relative w-full group">
      <input
        type="text"
        v-model="internalSearch"
        @focus="onInputFocus"
        @input="onInput"
        :placeholder="placeholder || 'Buscar...'"
        :disabled="disabled"
        class="w-full px-5 py-4 pl-12 bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-[0.75rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 dark:text-gray-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        :class="{ 'border-red-300 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20': error }"
      />
      
      <div class="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <Loader2 v-if="loading" class="w-5 h-5 text-blue-500 animate-spin" />
        <Search v-else class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
      </div>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform scale-95 opacity-0 -translate-y-2"
        enter-to-class="transform scale-100 opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform scale-100 opacity-100 translate-y-0"
        leave-to-class="transform scale-95 opacity-0 -translate-y-2"
      >
        <div 
          v-if="isOpen && !disabled"
          class="absolute z-50 w-full mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[0.75rem] border-2 border-gray-200 dark:border-gray-700 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-gray-900/20 overflow-hidden"
        >
          <div class="max-h-[300px] overflow-y-auto p-2 space-y-1 sm:w-full">
            <div v-if="internalSearch.length < 2" class="px-6 py-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center">
              Digite pelo menos 2 caracteres...
            </div>
            
            <template v-else>
              <button
                v-for="option in options"
                :key="option.value"
                @click="selectOption(option)"
                type="button"
                class="w-full relative flex items-center px-4 py-3 text-sm font-bold rounded-xl outline-none transition-all duration-200 group text-left"
                :class="[
                  modelValue === option.value 
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                ]"
              >
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 group-hover:scale-110 transition-transform sm:block hidden"
                     :class="modelValue === option.value ? 'bg-blue-100/50 dark:bg-blue-900/50' : 'bg-gray-100/50 dark:bg-gray-700/50'">
                  <span class="font-black text-xs uppercase "
                        :class="modelValue === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'">
                    {{ option.label.charAt(0) }}
                  </span>
                </div>
                <span class="truncate flex-1">{{ option.label }}</span>
                
                <Check 
                  v-if="modelValue === option.value" 
                  class="w-4 h-4 text-blue-600 dark:text-blue-400 ml-3" 
                />
              </button>
              
              <div v-if="!options || options.length === 0" class="px-6 py-8 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] text-center">
                {{ loading ? 'Buscando...' : (emptyMessage || 'Nenhum item encontrado') }}
              </div>
            </template>
          </div>
        </div>
      </transition>
    </div>

    <span v-if="error" class="text-[10px] font-bold text-red-500 ml-2 uppercase tracking-widest">
      {{ error }}
    </span>
  </div>
</template>
