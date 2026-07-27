<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { MessageCircle, CheckCheck, Loader2, Send } from 'lucide-vue-next'
import { useProposalChat } from '../../composables/useProposalChat'
import { format } from 'date-fns'
import type { ProposalDTO } from '../../../types'

const props = defineProps<{
  open: boolean
  proposal: ProposalDTO | null
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'refresh'): void
}>()

const isModalOpen = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const proposalId = computed(() => props.proposal?._id || '')

const {
  messages,
  newMessage,
  isSendingMessage,
  groupedMessages,
  loadMessages,
  sendMessage,
  connectPusher,
  disconnectPusher
} = useProposalChat({
  role: 'freelancer',
  proposalId
})

const chatMessagesRef = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesRef.value) {
      chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
    }
  })
}

// Watch messages to scroll
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.proposal) {
    await loadMessages()
    connectPusher(props.proposal._id)
    scrollToBottom()
  } else {
    disconnectPusher()
    emit('refresh')
  }
})

const formatMessageTime = (date: any) => {
  return format(new Date(date), 'HH:mm')
}
</script>

<template>
  <BaseDialog
    v-model:open="isModalOpen"
    title="Dúvidas e Alterações"
    size="lg"
  >
    <div v-if="proposal" class="p-0 flex flex-col md:h-[65vh] h-[80vh] bg-[#E5DDD5] dark:bg-gray-950 rounded-b-[0.5rem] overflow-hidden">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900 shadow-sm z-10 flex items-center justify-between">
        <div>
          <h3 class="text-xl font-black text-gray-900 dark:text-gray-50 tracking-tight leading-tight">{{ proposal.title }}</h3>
          <p class="text-xs font-bold text-gray-400 dark:text-gray-400 uppercase tracking-widest mt-1">{{ proposal.client.name }}</p>
        </div>
      </div>

      <!-- Messages Area -->
      <div ref="chatMessagesRef" class="flex-1 overflow-y-auto p-6 space-y-4 bg-[#dfe4ea] dark:bg-gray-900/80 scrollbar-hide">
        <div v-if="!groupedMessages?.length" class="text-center py-20 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-[0.5rem] p-8 max-w-xs mx-auto mt-10">
          <div class="w-16 h-16 bg-white dark:bg-gray-800 rounded-[0.5rem] flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <MessageCircle class="w-6 h-6 text-gray-300 dark:text-gray-500" />
          </div>
          <p class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nenhuma interação iniciada</p>
        </div>

        <div v-for="group in groupedMessages" :key="group.date" class="space-y-4">
          <!-- Date Separator -->
          <div class="flex justify-center my-6">
            <span class="px-4 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl text-[9px] font-black text-gray-500 dark:text-gray-300 uppercase tracking-widest shadow-sm">
              {{ group.date }}
            </span>
          </div>

          <div
            v-for="msg in group.items"
            :key="msg._id"
            :class="[
              'flex flex-col max-w-[85%] relative',
              msg.sender === 'freelancer' ? 'ml-auto items-end' : 'items-start'
            ]"
          >
            <!-- Bubble -->
            <div
              :class="[
                'px-4 py-2.5 rounded-[0.5rem] text-sm font-medium leading-relaxed shadow-sm min-w-[80px]',
                msg.sender === 'freelancer'
                  ? 'bg-[#DCF8C6] dark:bg-emerald-950 dark:text-emerald-100 text-gray-800 rounded-tr-none'
                  : 'bg-white dark:bg-gray-800 dark:text-gray-100 text-gray-800 rounded-tl-none'
              ]"
            >
              {{ msg.text }}
              
              <!-- Time and Status inside bubble -->
              <div class="flex items-center justify-end gap-1 mt-1 -mr-1">
                <span class="text-[9px] font-bold opacity-40 uppercase tracking-tighter">
                  {{ formatMessageTime(msg.createdAt) }}
                </span>
                <template v-if="msg.sender === 'freelancer'">
                  <CheckCheck v-if="msg.read" class="w-3 h-3 text-blue-500" />
                  <CheckCheck v-else class="w-3 h-3 text-gray-400" />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 bg-[#F0F2F5] dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
        <form @submit.prevent="sendMessage" class="flex gap-3 items-center">
          <div class="flex-1 relative">
            <input
              v-model="newMessage"
              placeholder="Digite uma mensagem..."
              class="w-full px-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-500/20 rounded-[0.5rem] outline-none font-medium text-sm shadow-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <button
            type="submit"
            :disabled="isSendingMessage || !newMessage.trim()"
            class="w-12 h-12 bg-[#00A884] hover:bg-[#008F6A] rounded-full text-white shadow-md flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
          >
            <Loader2 v-if="isSendingMessage" class="w-5 h-5 animate-spin" />
            <Send v-else class="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  </BaseDialog>
</template>
