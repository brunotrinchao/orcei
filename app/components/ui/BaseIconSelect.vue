<script setup lang="ts">
import * as LucideIcons from 'lucide-vue-next'
import { Check, ChevronDown, Search } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: string
  label?: string
}>()

const emit = defineEmits(['update:modelValue'])

const icons = [
  'Package', 'Briefcase', 'Zap', 'ShieldCheck', 'Eye', 'Lightbulb', 'FileText', 
  'ShoppingBag', 'Smartphone', 'Laptop', 'Camera', 'Music', 'Image', 'Video',
  'PenTool', 'Compass', 'Globe', 'Heart', 'Star', 'User', 'Settings', 'Hammer',
  'Wrench', 'Truck', 'CreditCard', 'Banknote', 'Coins', 'ChartBar', 'PieChart',
  'Target', 'Award', 'Trophy', 'Coffee', 'Utensils', 'Umbrella', 'Plane', 'MessageSquare',
  'Sparkles'
]

const searchQuery = ref('')
const isOpen = ref(false)

const filteredIcons = computed(() => {
  if (!searchQuery.value) return icons
  return icons.filter(i => i.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

function selectIcon(icon: string) {
  emit('update:modelValue', icon)
  isOpen.value = false
}

function getIcon(name: string) {
  return (LucideIcons as any)[name] || LucideIcons.HelpCircle
}

const dropdownRef = ref(null)
onClickOutside(dropdownRef, () => isOpen.value = false)
</script>

<template>
  <div class="space-y-2 relative" ref="dropdownRef">
    <label v-if="label" class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">
      {{ label }}
    </label>
    
    <button 
      type="button"
      @click="isOpen = !isOpen"
      class="w-full h-[56px] flex items-center justify-between px-5 bg-white dark:bg-gray-950 border-2 border-line dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 rounded-[.5rem] focus:ring-4 focus:ring-brand/10 focus:border-brand dark:focus:border-brand transition-all text-left outline-none group shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-[.5rem] flex items-center justify-center text-gray-600 dark:text-gray-300">
          <component :is="getIcon(modelValue || 'Package')" class="w-4 h-4" />
        </div>
        <span class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ modelValue || 'Selecione um ícone' }}</span>
      </div>
      <ChevronDown :class="['w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors', isOpen ? 'rotate-180' : '']" />
    </button>

    <!-- Dropdown -->
    <div 
      v-if="isOpen" 
      class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border-2 border-line dark:border-gray-800 rounded-[.5rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="p-4 border-b border-gray-100 dark:border-gray-800">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <BaseInput 
              v-model="searchQuery" 
              placeholder="Buscar ícone..." 
              :icon="Search"
            />
          <!-- <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar ícone..." 
            class="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-950 border-2 border-gray-100 dark:border-gray-800 rounded-[0.75rem] text-sm font-bold text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500/10 outline-none"
          > -->
        </div>
      </div>

      <div class="max-h-64 overflow-y-auto p-4 grid grid-cols-4 gap-2 scrollbar-thin scrollbar-thumb-gray-100 dark:scrollbar-thumb-gray-800">
        <button 
          v-for="icon in filteredIcons" 
          :key="icon"
          type="button"
          @click="selectIcon(icon)"
          :class="[
            'p-3 rounded-xl flex flex-col items-center gap-2 transition-all group',
            modelValue === icon 
              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold' 
              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          ]"
        >
          <component :is="getIcon(icon)" class="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span class="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{{ icon }}</span>
        </button>
      </div>

      <div v-if="filteredIcons.length === 0" class="p-8 text-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
        Nenhum ícone encontrado
      </div>
    </div>
  </div>
</template>
