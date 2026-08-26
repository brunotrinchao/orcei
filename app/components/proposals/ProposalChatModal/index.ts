import { ref, computed, watch, nextTick } from 'vue'
import { MessageCircle, CheckCheck, Loader2, Send } from 'lucide-vue-next'
import { useProposalChat } from '~/composables/useProposalChat'
import { format } from 'date-fns'
import type { ProposalDTO } from '~/types'

export function useProposalChatModal(
  props: { open: boolean; proposal: ProposalDTO | null },
  emit: (e: 'update:open' | 'refresh', val?: any) => void
) {
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

  return {
    isModalOpen,
    proposalId,
    messages,
    newMessage,
    isSendingMessage,
    groupedMessages,
    chatMessagesRef,
    loadMessages,
    sendMessage,
    formatMessageTime,
    MessageCircle,
    CheckCheck,
    Loader2,
    Send
  }
}
