<script setup lang="ts">
import { computed } from 'vue'
import { Check } from 'lucide-vue-next'
import { PROPOSAL_PHASES, getPhaseColor, getPhaseStepper } from '~/utils/proposalLifecycle'

const props = withDefaults(
  defineProps<{
    status: string | null | undefined
    signatureStatus?: string | null
    size?: 'sm' | 'md'
    showLabels?: boolean
  }>(),
  {
    signatureStatus: null,
    size: 'md',
    showLabels: true
  }
)

const current = computed(() => getPhaseStepper(props.status, props.signatureStatus).current)

const dotSize = computed(() => (props.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'))
const checkSize = computed(() => (props.size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'))

function isDone(index: number) {
  return index < current.value
}

function isCurrent(index: number) {
  return index === current.value
}
</script>

<template>
  <div class="w-full select-none">
    <ol class="flex items-start w-full" :aria-label="'Fases do orçamento'">
      <template v-for="(phase, index) in PROPOSAL_PHASES" :key="phase.key">
        <li
          class="flex flex-col items-center flex-1 min-w-0"
          :class="index === 0 ? 'text-left' : ''"
        >
          <div class="flex items-center w-full">
            <!-- conector esquerdo -->
            <div
              class="h-0.5 flex-1 rounded-full transition-colors duration-200"
              :class="index === 0 ? 'opacity-0' : (isDone(index) || isCurrent(index) ? getPhaseColor(PROPOSAL_PHASES[index - 1].key) + ' opacity-40' : 'bg-gray-200 dark:bg-gray-700')"
            />
            <!-- dot -->
            <div
              class="relative flex items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900 transition-all duration-200"
              :class="[
                dotSize,
                isDone(index)
                  ? getPhaseColor(phase.key)
                  : isCurrent(index)
                    ? getPhaseColor(phase.key)
                    : 'bg-gray-300 dark:bg-gray-700',
                isCurrent(index) ? 'scale-110' : ''
              ]"
            >
              <Check
                v-if="isDone(index)"
                class="text-white"
                :class="checkSize"
                aria-hidden="true"
              />
              <span
                v-if="isCurrent(index)"
                class="block w-1.5 h-1.5 rounded-full bg-white"
                aria-hidden="true"
              />
            </div>
            <!-- conector direito -->
            <div
              class="h-0.5 flex-1 rounded-full transition-colors duration-200"
              :class="index === PROPOSAL_PHASES.length - 1 ? 'opacity-0' : (isDone(index) ? getPhaseColor(phase.key) + ' opacity-40' : 'bg-gray-200 dark:bg-gray-700')"
            />
          </div>

          <!-- label -->
          <span
            v-if="showLabels || isCurrent(index)"
            class="mt-1.5 text-[10px] uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis max-w-full transition-colors duration-200"
            :class="[
              isCurrent(index)
                ? 'font-bold text-gray-900 dark:text-gray-100'
                : isDone(index)
                  ? 'font-medium text-gray-500 dark:text-gray-400'
                  : 'font-medium text-gray-400 dark:text-gray-600'
            ]"
          >
            {{ phase.label }}
          </span>
        </li>
      </template>
    </ol>
  </div>
</template>