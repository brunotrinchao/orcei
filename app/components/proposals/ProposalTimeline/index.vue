<script setup lang="ts">
import { useProposalTimeline, type HistoryItem } from './index'
import { getPhaseColor } from '~/utils/proposalLifecycle'

const props = withDefaults(
  defineProps<{
    history: HistoryItem[]
    status?: string | null
    grouped?: boolean
  }>(),
  {
    status: null,
    grouped: true
  }
)

const {
  filteredHistory,
  groupedByPhase,
  currentPhase,
  getActionLabel,
  getActionIcon,
  getActionColor,
  formatDate
} = useProposalTimeline(props)
</script>

<template>
  <div class="flow-root proposal-timeline-container">
    <template v-if="grouped && groupedByPhase.length > 0">
      <div v-for="group in groupedByPhase" :key="group.phase" class="mb-6 last:mb-0">
        <!-- header da fase -->
        <div class="flex items-center gap-2 mb-3">
          <span :class="['w-2 h-2 rounded-full', group.phase === 'system' ? 'bg-gray-400 dark:bg-gray-600' : getPhaseColor(group.phase)]" aria-hidden="true" />
          <h4 class="text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
            {{ group.label }}
          </h4>
          <span class="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>

        <ul role="list" class="space-y-1">
          <li v-for="(event, eventIdx) in group.items" :key="event._id || eventIdx">
            <div class="relative flex space-x-3 py-1.5">
              <div>
                <span :class="[getActionColor(event.action), 'flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white dark:ring-gray-900']">
                  <component :is="getActionIcon(event.action)" class="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1">
                <div class="min-w-0">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ getActionLabel(event.action) }}
                    <span v-if="event.details?.paymentMethod" class="font-medium text-gray-900 dark:text-gray-200">
                      via {{ event.details.paymentMethod === 'cash' ? 'À vista' : 'Cartão' }}
                    </span>
                    <span v-if="event.action === 'google_sync'" class="text-xs opacity-70">
                      ({{ event.details?.calendar ? 'Agenda + Drive' : 'Drive' }})
                    </span>
                  </p>
                </div>
                <div class="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                  <time :datetime="event.timestamp">{{ formatDate(event.timestamp) }}</time>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- placeholder quando a fase atual ainda não tem eventos -->
      <div
        v-if="!groupedByPhase.some(g => g.phase === currentPhase)"
        class="mt-2 py-3 text-center"
      >
        <p class="text-xs text-gray-400 dark:text-gray-600 italic">
          Nada registrado nesta etapa ainda.
        </p>
      </div>
    </template>

    <!-- fallback: timeline plana (padrão anterior) -->
    <ul v-else role="list" class="-mb-8">
      <li v-for="(event, eventIdx) in filteredHistory" :key="event._id || eventIdx">
        <div class="relative pb-8">
          <span v-if="eventIdx !== filteredHistory.length - 1" class="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800" aria-hidden="true" />
          <div class="relative flex space-x-3">
            <div>
              <span :class="[getActionColor(event.action), 'flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white dark:ring-gray-900']">
                <component :is="getActionIcon(event.action)" class="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ getActionLabel(event.action) }}
                  <span v-if="event.details?.paymentMethod" class="font-medium text-gray-900 dark:text-gray-200">
                    via {{ event.details.paymentMethod === 'cash' ? 'À vista' : 'Cartão' }}
                  </span>
                  <span v-if="event.action === 'google_sync'" class="text-xs opacity-70">
                    ({{ event.details?.calendar ? 'Agenda + Drive' : 'Drive' }})
                  </span>
                </p>
              </div>
              <div class="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                <time :datetime="event.timestamp">{{ formatDate(event.timestamp) }}</time>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped src="./index.css"></style>