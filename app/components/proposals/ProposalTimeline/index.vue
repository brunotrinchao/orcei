<script setup lang="ts">
import { useProposalTimeline, type HistoryItem } from './index'

const props = defineProps<{
  history: HistoryItem[]
}>()

const {
  filteredHistory,
  getActionLabel,
  getActionIcon,
  getActionColor,
  formatDate
} = useProposalTimeline(props)
</script>

<template>
  <div class="flow-root proposal-timeline-container">
    <ul role="list" class="-mb-8">
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
