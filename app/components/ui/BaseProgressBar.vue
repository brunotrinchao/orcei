<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value?: number
  valor?: number
  max?: number
  maximo?: number
  color?: string
  cor?: string
  height?: string
  altura?: string
  trackClass?: string
  showLabel?: boolean
  exibirRotulo?: boolean
  label?: string
  rotulo?: string
  animated?: boolean
  indeterminate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  value: undefined,
  valor: undefined,
  max: 100,
  maximo: 100,
  color: 'bg-[#ccff00]',
  cor: undefined,
  height: 'h-2',
  altura: undefined,
  trackClass: 'bg-slate-100 dark:bg-gray-800',
  showLabel: false,
  exibirRotulo: false,
  label: '',
  rotulo: '',
  animated: true,
  indeterminate: false
})

const currentValue = computed(() => {
  const val = props.value !== undefined ? props.value : (props.valor !== undefined ? props.valor : 0)
  return Math.max(0, val)
})

const currentMax = computed(() => {
  const m = props.max !== 100 ? props.max : (props.maximo !== 100 ? props.maximo : 100)
  return m > 0 ? m : 100
})

const percentage = computed(() => {
  const raw = (currentValue.value / currentMax.value) * 100
  return Math.min(100, Math.max(0, Number(raw.toFixed(2))))
})

const barColorClass = computed(() => {
  const chosen = props.cor || props.color || 'bg-[#ccff00]'
  if (chosen.startsWith('bg-')) return chosen
  if (chosen.startsWith('#') || chosen.startsWith('rgb') || chosen.startsWith('hsl')) return ''
  
  const presetColors: Record<string, string> = {
    lime: 'bg-[#ccff00]',
    green: 'bg-emerald-500',
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-600',
    indigo: 'bg-indigo-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    red: 'bg-red-500',
    sky: 'bg-sky-500',
    gradient: 'bg-gradient-to-r from-indigo-500 to-emerald-500'
  }
  return presetColors[chosen] || chosen
})

const barInlineStyle = computed(() => {
  const chosen = props.cor || props.color || 'bg-[#ccff00]'
  const styleObj: Record<string, string> = {
    width: `${percentage.value}%`
  }
  if (chosen.startsWith('#') || chosen.startsWith('rgb') || chosen.startsWith('hsl')) {
    styleObj.backgroundColor = chosen
  }
  return styleObj
})

const barHeightClass = computed(() => props.altura || props.height || 'h-2.5')
const shouldShowLabel = computed(() => props.showLabel || props.exibirRotulo)
const labelText = computed(() => props.label || props.rotulo || '')
</script>

<template>
  <div class="w-full">
    <!-- Header/Label opcional -->
    <div
      v-if="shouldShowLabel || labelText || $slots.label"
      class="flex justify-between items-center text-xs mb-1.5 font-bold text-gray-700 dark:text-gray-300"
    >
      <span>
        <slot name="label">{{ labelText }}</slot>
      </span>
      <span v-if="shouldShowLabel" class="font-mono text-[11px] text-gray-500 dark:text-gray-400">
        {{ percentage }}%
      </span>
    </div>

    <!-- Progress Bar Track -->
    <div
      class="w-full rounded-full overflow-hidden relative"
      :class="[trackClass, barHeightClass]"
    >
    <div v-if="$slots.footer" class="p-x-2 w-full absolute inset-y-0 left-4 flex items-center">
        <slot name="footer" />
      </div>
      <!-- Indeterminate Animation -->
      <div
        v-if="indeterminate"
        class="h-full rounded-full animate-pulse"
        :class="barColorClass"
        :style="barInlineStyle"
      ></div>

      <!-- Determinate Bar -->
      <div
        v-else
        class="h-full rounded-full"
        :class="[barColorClass, animated ? 'transition-all duration-500 ease-out' : '']"
        :style="barInlineStyle"
      >
      
    </div>
    </div>
  </div>
</template>
