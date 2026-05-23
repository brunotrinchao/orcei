import { ref, computed, onUnmounted, type Ref } from 'vue'
import { ptBR } from 'date-fns/locale'
import { isToday, isYesterday, format } from 'date-fns'

export interface Message {
  _id: string
  text: string
  sender: 'freelancer' | 'client'
  createdAt: string
  status: 'pending' | 'sent'
  read?: boolean
}

export interface UseProposalChatOptions {
  proposalId?: string | Ref<string>
  role: 'freelancer' | 'client'
  slug?: string
  token?: string
}

export function useProposalChat(options: UseProposalChatOptions) {
  const { notify } = useAlerts()
  const messages = ref<Message[]>([])
  const newMessage = ref('')
  const isSendingMessage = ref(false)
  const pending = ref(false)

  const propId = computed(() => {
    return typeof options.proposalId === 'string'
      ? options.proposalId
      : (options.proposalId?.value || '')
  })

  // Group messages by date
  const groupedMessages = computed(() => {
    if (!messages.value) return []
    const groups: { date: string, items: Message[] }[] = []
    
    messages.value.forEach(msg => {
      const date = new Date(msg.createdAt)
      let label = ''
      
      if (isToday(date)) label = 'Hoje'
      else if (isYesterday(date)) label = 'Ontem'
      else label = format(date, "d 'de' MMMM", { locale: ptBR })
      
      const group = groups.find(g => g.date === label)
      if (group) group.items.push(msg)
      else groups.push({ date: label, items: [msg] })
    })
    
    return groups
  })

  // Fetch messages
  async function loadMessages() {
    if (options.role === 'freelancer') {
      if (!propId.value) return
      pending.value = true
      try {
        const data = await $fetch<any[]>(`/api/proposals/${propId.value}/messages`)
        messages.value = data.map(m => ({ ...m, status: 'sent' }))
      } catch (e) {
        console.error('Failed to load messages:', e)
      } finally {
        pending.value = false
      }
    } else {
      if (!options.slug) return
      pending.value = true
      try {
        const data = await $fetch<any[]>(`/api/proposals/public/messages`, {
          query: { slug: options.slug, t: options.token }
        })
        messages.value = data.map(m => ({ ...m, status: 'sent' }))
      } catch (e) {
        console.error('Failed to load public messages:', e)
      } finally {
        pending.value = false
      }
    }
  }

  // Send message
  async function sendMessage() {
    const text = newMessage.value.trim()
    if (!text || isSendingMessage.value) return
    
    newMessage.value = ''
    const tempId = Date.now().toString()
    const optimisticMessage: Message = {
      _id: tempId,
      text,
      sender: options.role === 'freelancer' ? 'freelancer' : 'client',
      createdAt: new Date().toISOString(),
      status: 'pending'
    }
    
    messages.value = [...messages.value, optimisticMessage]

    try {
      let sentMessage: any
      if (options.role === 'freelancer') {
        sentMessage = await $fetch<any>(`/api/proposals/${propId.value}/messages`, {
          method: 'POST',
          body: { text }
        })
      } else {
        sentMessage = await $fetch<any>(`/api/proposals/public/messages`, {
          method: 'POST',
          query: { slug: options.slug, t: options.token },
          body: { text }
        })
      }
      
      messages.value = messages.value.map(m => 
        m._id === tempId ? { ...sentMessage, status: 'sent' } : m
      )
    } catch (e) {
      messages.value = messages.value.filter(m => m._id !== tempId)
      notify('Erro', 'Erro ao enviar mensagem')
    }
  }

  // Mark as read
  async function markAsRead() {
    if (options.role === 'client') {
      if (!options.slug) return
      try {
        await $fetch(`/api/proposals/public/messages/read`, {
          method: 'POST',
          query: { slug: options.slug, t: options.token }
        })
      } catch (e) {
        console.error('Failed to mark messages as read')
      }
    }
  }

  // Pusher
  let pusherInstance: any = null
  let chatChannel: any = null

  function connectPusher(customProposalId?: string) {
    const activeProposalId = customProposalId || propId.value
    if (!activeProposalId) return

    const { pusher } = usePusher(
      options.role === 'freelancer' 
        ? { chatRole: 'freelancer' }
        : { slug: options.slug, token: options.token, chatRole: 'client' }
    )

    if (pusher) {
      pusherInstance = pusher
      chatChannel = pusher.subscribe(`private-proposal-${activeProposalId}`)
      chatChannel.bind('new-message', (data: any) => {
        const existingIdx = messages.value.findIndex(m => m._id === data._id || (m.status === 'pending' && m.text === data.text))
        if (existingIdx !== -1) {
          messages.value[existingIdx] = { ...data, status: 'sent' }
        } else {
          messages.value = [...messages.value, { ...data, status: 'sent' }]
        }
      })
    }
  }

  function disconnectPusher() {
    if (chatChannel) chatChannel.unbind_all()
    if (pusherInstance) pusherInstance.disconnect()
    pusherInstance = null
    chatChannel = null
  }

  onUnmounted(() => {
    disconnectPusher()
  })

  return {
    messages,
    newMessage,
    isSendingMessage,
    pending,
    groupedMessages,
    loadMessages,
    sendMessage,
    markAsRead,
    connectPusher,
    disconnectPusher
  }
}
