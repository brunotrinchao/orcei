<script setup lang="ts">
import type { Component } from 'vue'
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectViewport,
  SelectItem,
  SelectItemText,
  SelectItemIndicator,
  SelectPortal,
  SelectIcon,
  SelectScrollUpButton,
  SelectScrollDownButton
} from 'radix-vue'
import { ChevronDown, ChevronUp, Check } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useFieldValidation } from '~/composables/useFormValidation'

interface Option {
  label: string
  value: string
}

const props = withDefaults(
  defineProps<{
    options: Option[]
    placeholder?: string
    label?: string
    error?: string
    disabled?: boolean
    required?: boolean
    icon?: Component
    background?:
      | 'white'
      | 'slate'
      | 'blue'
      | 'gray'
      | 'emerald'
      | 'violet'
      | 'transparent'
      | string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | string
    border?:
      | boolean
      | 'default'
      | 'none'
      | 'slate'
      | 'blue'
      | 'gray'
      | 'emerald'
      | 'violet'
      | 'amber'
      | string
  }>(),
  {
    background: 'white',
    size: 'md',
    border: true
  }
)

const modelValue = defineModel<string>()
const id = useId()

const triggerRef = ref<InstanceType<typeof SelectTrigger> | null>(null)

const isEmpty = () => !!props.required && !modelValue.value
const { submitAttempted } = useFieldValidation({
  isEmpty,
  focus: () => (triggerRef.value as any)?.$el?.focus?.()
})
const showRequiredError = computed(() => submitAttempted.value && isEmpty())
const displayError = computed(() => props.error || (showRequiredError.value ? 'Campo obrigatório' : ''))

const bgClasses = computed(() => {
  const bg = props.background?.trim() || 'white'

  switch (bg) {
    case 'slate':
    case 'slate-100':
      return 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500'
    case 'slate-900':
    case 'slate-950':
      return 'bg-slate-900 dark:bg-slate-950 text-slate-100 placeholder:text-slate-500'
    case 'blue':
    case 'blue-50':
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 placeholder:text-blue-400 dark:placeholder:text-blue-400'
    case 'blue-900':
    case 'blue-950':
      return 'bg-blue-950 text-blue-100 placeholder:text-blue-400'
    case 'gray':
    case 'gray-100':
      return 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    case 'gray-900':
    case 'gray-950':
      return 'bg-gray-900 dark:bg-gray-950 text-gray-100 placeholder:text-gray-500'
    case 'zinc':
    case 'zinc-100':
      return 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500'
    case 'zinc-900':
    case 'zinc-950':
      return 'bg-zinc-900 dark:bg-zinc-950 text-zinc-100 placeholder:text-zinc-500'
    case 'emerald':
    case 'green':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 placeholder:text-emerald-600/70 dark:placeholder:text-emerald-400'
    case 'violet':
    case 'purple':
      return 'bg-violet-50 dark:bg-violet-950/40 text-violet-950 dark:text-violet-100 placeholder:text-violet-400 dark:placeholder:text-violet-400'
    case 'transparent':
      return 'bg-transparent text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    case 'white':
      return 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    default: {
      if (bg.startsWith('bg-')) {
        const isDarkBg = /900|950|800|black/.test(bg)
        const textFallback = isDarkBg
          ? 'text-white placeholder:text-slate-400'
          : 'text-slate-900 placeholder:text-slate-400'
        return `${bg} ${textFallback}`
      }
      return 'bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-50 placeholder:text-gray-400 dark:placeholder:text-gray-500'
    }
  }
})

const borderClasses = computed(() => {
  if (props.border === false || props.border === 'none') {
    return 'border-0 focus:ring-4 focus:ring-blue-500/10'
  }

  switch (props.border) {
    case 'slate':
      return 'border-2 border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 focus:border-slate-500 dark:focus:border-slate-400 focus:ring-4 focus:ring-slate-500/10'
    case 'blue':
      return 'border-2 border-blue-300 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-700 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
    case 'gray':
      return 'border-2 border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 focus:border-gray-600 dark:focus:border-gray-500 focus:ring-4 focus:ring-gray-500/10'
    case 'emerald':
    case 'green':
      return 'border-2 border-emerald-300 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-700 focus:border-emerald-600 dark:focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
    case 'violet':
    case 'purple':
      return 'border-2 border-violet-300 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-700 focus:border-violet-600 dark:focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10'
    case 'amber':
      return 'border-2 border-amber-300 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-700 focus:border-amber-600 dark:focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'
    case true:
    case 'default':
    default:
      if (
        typeof props.border === 'string' &&
        props.border.startsWith('border')
      ) {
        return props.border
      }
      return 'border-2 border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 dark:focus:border-blue-500'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'py-1.5 text-xs rounded-md min-h-[32px]'
    case 'sm':
      return 'py-2.5 text-xs rounded-lg min-h-[40px]'
    case 'lg':
      return 'py-4 text-base rounded-[0.75rem] min-h-[60px]'
    case 'xl':
      return 'py-5 text-lg rounded-xl min-h-[68px]'
    case '2xl':
      return 'py-6 text-xl rounded-2xl min-h-[76px]'
    case 'md':
    default:
      if (
        props.size &&
        (props.size.startsWith('py-') || props.size.startsWith('text-'))
      ) {
        return props.size
      }
      return 'py-3.5 text-sm rounded-[0.75rem] min-h-[52px]'
  }
})
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" :id="`label-${id}`" class="block text-xs font-black text-slate-700 dark:text-gray-400 uppercase tracking-widest ml-1">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>

    <div class="relative flex items-center w-full">
      <!-- Ícone na esquerda se fornecido -->
      <div v-if="icon || $slots.icon" class="absolute left-4 z-10 flex items-center gap-1.5 text-slate-500 dark:text-gray-500 pointer-events-none">
        <slot name="icon">
          <component :is="icon" v-if="icon" class="w-4 h-4" />
        </slot>
      </div>

      <SelectRoot v-model="modelValue" :disabled="disabled">
        <SelectTrigger
          ref="triggerRef"
          :aria-labelledby="label ? `label-${id}` : undefined"
          :class="[
            'inline-flex items-center justify-between w-full transition-all outline-none font-bold group disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed shadow-xs',
            borderClasses,
            bgClasses,
            sizeClasses,
            icon || $slots.icon ? 'pl-12 pr-5' : 'px-5',
            displayError ? 'border-red-500 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-500 focus:ring-red-500/20' : ''
          ]"
        >
          <SelectValue :placeholder="placeholder || 'Selecione...'" />
          <SelectIcon>
            <ChevronDown class="w-4 h-4 text-gray-500 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
          </SelectIcon>
        </SelectTrigger>

        <SelectPortal>
          <SelectContent
            class="z-[9999] min-w-[var(--radix-select-trigger-width)] bg-white dark:bg-gray-900 rounded-[0.75rem] border-2 border-gray-300 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            position="popper"
            :side-offset="8"
            :avoid-collisions="true"
            @pointer-down-outside="(e) => {
              // Prevent closing the parent dialog when clicking outside the select but within the portal
              if (e.detail.originalEvent.type === 'pointerdown') return;
            }"
          >
            <SelectScrollUpButton class="flex items-center justify-center h-8 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-default">
              <ChevronUp class="w-4 h-4" />
            </SelectScrollUpButton>

            <SelectViewport class="p-2">
              <SelectItem
                v-for="option in options"
                :key="option.value"
                :value="option.value || '__EMPTY__'"
                class="relative flex items-center px-8 py-3 text-sm font-bold text-gray-600 dark:text-gray-300 rounded-[0.75rem] cursor-pointer outline-none focus:bg-gray-50 dark:focus:bg-gray-800 focus:text-gray-900 dark:focus:text-white data-[state=checked]:text-gray-900 dark:data-[state=checked]:text-white data-[state=checked]:bg-gray-50 dark:data-[state=checked]:bg-gray-800 transition-colors"
              >
                <SelectItemIndicator class="absolute left-2 inline-flex items-center justify-center">
                  <Check class="w-4 h-4 text-gray-900 dark:text-white" />
                </SelectItemIndicator>
                <SelectItemText>{{ option.label }}</SelectItemText>
              </SelectItem>
              <div v-if="!options || options.length === 0" class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                Sem Opções
              </div>
            </SelectViewport>

            <SelectScrollDownButton class="flex items-center justify-center h-8 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-default">
              <ChevronDown class="w-4 h-4" />
            </SelectScrollDownButton>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
    </div>

   <span class="block min-h-[14px] text-[10px] font-bold text-red-500 ml-1 uppercase leading-[14px]"
    :class="displayError ? 'block' : 'hidden'">
      {{ displayError }}
</span>
  </div>
</template>
