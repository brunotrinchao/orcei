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
  'Target', 'Award', 'Trophy', 'Coffee', 'Utensils', 'Umbrella', 'Plane'
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
    <label v-if="label" class="block text-xs font-black text-gray-400 uppercase tracking-widest ml-2">
      {{ label }}
    </label>
    
    <button 
      type="button"
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between px-6 py-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-blue-200 transition-all text-left"
    >
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-600">
          <component :is="getIcon(modelValue || 'Package')" class="w-5 h-5" />
        </div>
        <span class="font-bold text-gray-900">{{ modelValue || 'Selecione um ícone' }}</span>
      </div>
      <ChevronDown :class="['w-5 h-5 text-gray-400 transition-transform', isOpen ? 'rotate-180' : '']" />
    </button>

    <!-- Dropdown -->
    <div 
      v-if="isOpen" 
      class="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-100 rounded-[2rem] shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div class="p-4 border-b border-gray-50">
        <div class="relative">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Buscar ícone..." 
            class="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/10 outline-none"
          >
        </div>
      </div>

      <div class="max-h-64 overflow-y-auto p-4 grid grid-cols-4 gap-2 scrollbar-thin scrollbar-thumb-gray-100">
        <button 
          v-for="icon in filteredIcons" 
          :key="icon"
          type="button"
          @click="selectIcon(icon)"
          :class="[
            'p-3 rounded-xl flex flex-col items-center gap-2 transition-all group',
            modelValue === icon ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50 text-gray-400 hover:text-gray-900'
          ]"
        >
          <component :is="getIcon(icon)" class="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span class="text-[8px] font-black uppercase tracking-tighter truncate w-full text-center">{{ icon }}</span>
        </button>
      </div>

      <div v-if="filteredIcons.length === 0" class="p-8 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
        Nenhum ícone encontrado
      </div>
    </div>
  </div>
</template>
