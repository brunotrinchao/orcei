<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from 'radix-vue'
import { Calendar, Clock, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  label?: string
  description?: string
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)

// Separamos a data e a hora para o usuário preencher de forma mais amigável
const internalDate = ref('')
const internalTime = ref('')

function syncInternalFromProps(val?: string) {
  if (!val) {
    internalDate.value = ''
    internalTime.value = ''
    return
  }
  // val expected in format YYYY-MM-DDTHH:mm
  const parts = val.split('T')
  if (parts.length === 2) {
    internalDate.value = parts[0]
    internalTime.value = parts[1]
  } else {
    // If we only have date
    internalDate.value = parts[0]
    internalTime.value = '12:00'
  }
}

watch(() => props.modelValue, syncInternalFromProps, { immediate: true })

const formattedDateTime = computed(() => {
  if (!props.modelValue) return 'Selecionar Data e Hora'
  
  const dateObj = new Date(props.modelValue)
  if (isNaN(dateObj.getTime())) return props.modelValue
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
})

function apply() {
  if (internalDate.value) {
    const time = internalTime.value || '12:00'
    emit('update:modelValue', `${internalDate.value}T${time}`)
  } else {
    emit('update:modelValue', '')
  }
  isOpen.value = false
}

function clear() {
  internalDate.value = ''
  internalTime.value = ''
  emit('update:modelValue', '')
  isOpen.value = false
}

function setPreset(daysToAdd: number) {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysToAdd)
  
  internalDate.value = targetDate.toISOString().split('T')[0]
  internalTime.value = '14:00' // Horário comercial padrão
  apply()
}
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">
      {{ label }}
    </label>

    <PopoverRoot v-model:open="isOpen">
      <div class="relative">
        <PopoverTrigger
          class="w-full flex items-center gap-3 px-5 py-4 bg-white dark:bg-gray-900 border-2 border-line dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-[.5rem] transition-all text-left focus:ring-4 focus:ring-brand/20 focus:border-brand outline-none group"
        >
          <Calendar class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          <span :class="[!modelValue ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white', 'font-bold text-sm truncate flex-1']">
            {{ formattedDateTime }}
          </span>
          <X 
            v-if="modelValue" 
            @click.stop="clear"
            class="w-4 h-4 text-gray-400 hover:text-red-500 transition-all cursor-pointer"
          />
        </PopoverTrigger>

        <p v-if="description" class="text-[9px] text-gray-500 dark:text-gray-400 font-bold ml-1 uppercase mt-2">
          {{ description }}
        </p>

        <PopoverContent
            side="bottom"
            :side-offset="8"
            align="start"
            class="z-[99999] bg-white dark:bg-gray-900 rounded-[.5rem] border-2 border-line dark:border-gray-700 shadow-2xl dark:shadow-gray-950/50 p-6 sm:p-6 animate-in fade-in zoom-in-95 duration-200 min-w-[320px] max-w-[90vw]"
          >
            <div class="space-y-6">
              
              <!-- Sugestões Rápidas -->
              <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Sugestões Rápidas</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button 
                    v-for="p in [
                      { label: 'Hoje', days: 0 },
                      { label: 'Amanhã', days: 1 },
                      { label: 'Em 7 dias', days: 7 },
                      { label: 'Em 15 dias', days: 15 }
                    ]"
                    :key="p.label"
                    @click="setPreset(p.days)"
                    class="px-3 py-2 rounded-[.5rem] text-sm font-semibold bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-brand-soft dark:hover:bg-brand/20 hover:text-brand dark:hover:text-brand transition-all border border-transparent hover:border-brand/20 dark:hover:border-brand/40"
                  >
                    {{ p.label }}
                  </button>
                </div>
              </div>

              <!-- Inputs Nativos Separados para melhor UX mobile/desktop -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Calendar class="w-4 h-4 text-blue-500" />
                    <label class="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">Data</label>
                  </div>
                  <input 
                    v-model="internalDate" 
                    type="date"
                    class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-line dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-[.5rem] focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none font-bold text-sm text-gray-900 dark:text-white transition-all cursor-pointer"
                  >
                </div>
                
                <div class="space-y-2">
                  <div class="flex items-center gap-2">
                    <Clock class="w-4 h-4 text-blue-500" />
                    <label class="text-[10px] font-black text-gray-900 dark:text-gray-300 uppercase tracking-widest">Horário</label>
                  </div>
                  <input 
                    v-model="internalTime" 
                    type="time"
                    class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-line dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 rounded-[.5rem] focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none font-bold text-sm text-gray-900 dark:text-white transition-all cursor-pointer"
                  >
                </div>
              </div>

              <!-- Footer do Popover -->
              <div class="pt-4 border-t border-gray-50 dark:border-gray-800 flex gap-3">
                <button 
                  @click="clear"
                  class="flex-1 px-4 py-3 rounded-[.5rem] text-sm font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  Limpar
                </button>
                <button 
                  @click="apply"
                  class="flex-[2] px-4 py-3 rounded-[.5rem] text-sm font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-black dark:hover:bg-white transition-all shadow-lg dark:shadow-gray-950/50"
                >
                  Confirmar Data
                </button>
              </div>
            </div>
          </PopoverContent>
      </div>
    </PopoverRoot>
  </div>
</template>
