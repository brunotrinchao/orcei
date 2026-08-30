<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
  PopoverPortal,
} from 'radix-vue'
import { Calendar, X, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  start?: string
  end?: string
  label?: string
}>()

const emit = defineEmits(['update:start', 'update:end'])

const isOpen = ref(false)

const internalStart = ref(props.start || '')
const internalEnd = ref(props.end || '')

// Watch for external changes
watch(() => props.start, (val) => internalStart.value = val || '')
watch(() => props.end, (val) => internalEnd.value = val || '')

const formattedRange = computed(() => {
  if (!props.start && !props.end) return 'Filtrar por período'
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  if (props.start && props.end) {
    if (props.start === props.end) return formatDate(props.start)
    return `${formatDate(props.start)} - ${formatDate(props.end)}`
  }
  return formatDate(props.start || props.end)
})

function applyRange() {
  emit('update:start', internalStart.value)
  emit('update:end', internalEnd.value)
  isOpen.value = false
}

function clearRange() {
  internalStart.value = ''
  internalEnd.value = ''
  emit('update:start', '')
  emit('update:end', '')
  isOpen.value = false
}

function setPreset(days: number) {
  const now = new Date()
  const start = new Date()
  start.setDate(now.getDate() - days)
  
  internalStart.value = start.toISOString().split('T')[0]
  internalEnd.value = now.toISOString().split('T')[0]
  applyRange()
}
</script>

<template>
  <div :class="label ? 'space-y-2' : ''">
    <label v-if="label" class="block text-xs font-normal text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-2">
      {{ label }}
    </label>

    <PopoverRoot v-model:open="isOpen">
      <div class="relative">
        <PopoverTrigger
          class="w-full h-[52px] flex items-center gap-3 px-5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 hover:border-gray-200 rounded-[0.75rem] transition-all text-left focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none group"
        >
          <Calendar class="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 transition-colors" />
          <span :class="[(!start && !end) ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white', 'font-normal text-sm truncate flex-1']">
            {{ formattedRange }}
          </span>
          <X 
            v-if="start || end" 
            @click.stop="clearRange"
            class="w-4 h-4 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer"
          />
        </PopoverTrigger>

        <PopoverPortal>
          <PopoverContent
            side="bottom"
            :side-offset="8"
            align="end"
            class="z-[100] bg-white dark:bg-gray-900 rounded-[0.75rem] border border-gray-300 dark:border-gray-800 shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200 min-w-[320px]"
          >
            <div class="space-y-8">
              <!-- Presets -->
              <div class="grid grid-cols-2 gap-2">
                <BaseButton size="sm" variant="secondary"
                  v-for="p in [
                    { label: 'Hoje', days: 0 },
                    { label: '7 dias', days: 7 },
                    { label: '30 dias', days: 30 },
                    { label: '90 dias', days: 90 }
                  ]"
                  :key="p.label"
                  @click="setPreset(p.days)"
                >
                  {{ p.label }}
                </BaseButton>
              </div>

              <!-- Inputs -->
              <div class="space-y-4">
                <div class="space-y-2">
                  <BaseInput v-model="internalStart" type="date" label="Início"/>
                </div>
                <div class="space-y-2">
                  <BaseInput v-model="internalEnd" type="date" label="Fim"/>
                </div>
              </div>

              <!-- Footer -->
              <div class="pt-4 border-t border-gray-50 dark:border-gray-800 flex gap-3">
                <BaseButton size="sm" variant="ghost" class="flex-1" @click="clearRange">
                  Limpar
                </BaseButton>
                <BaseButton size="sm" class="flex-1" @click="applyRange">
                  Aplicar
                </BaseButton>
              </div>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </div>
    </PopoverRoot>
  </div>
</template>
