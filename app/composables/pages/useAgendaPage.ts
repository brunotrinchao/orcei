import { ref, computed, watch } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { Plus, MapPin, Calendar as CalendarIcon, Clock, FileText, Trash2, X, ExternalLink, CheckCircle2, User, Sparkles } from 'lucide-vue-next'
import type { ProposalDTO } from '~/types'

export function useAgendaPage() {
  const { notify, confirm: confirmAlert } = useAlerts()
  const { data: events, refresh: refreshEvents, pending: pendingEvents } = useLazyFetch<any[]>('/api/events')
  const { data: proposalsData, pending: pendingProposals } = useLazyFetch<any>('/api/proposals?limit=100')

  const isModalOpen = ref(false)
  const isSubmitting = ref(false)
  const { validate, reset: resetValidation } = useFormValidation()
  watch(isModalOpen, (open) => { if (!open) resetValidation() })
  const selectedEvent = ref<any>(null)
  const config = useRuntimeConfig()

  const form = ref({
    title: '',
    description: '',
    start: '',
    end: '',
    proposalId: '',
    allDay: false,
    color: '#3B82F6'
  })

  const proposalList = computed<ProposalDTO[]>(() => {
    if (!proposalsData.value) return []
    if (Array.isArray(proposalsData.value)) return proposalsData.value
    if (Array.isArray(proposalsData.value.items)) return proposalsData.value.items
    return []
  })

  const scheduledProposalIds = computed(() => {
    if (!events.value || !Array.isArray(events.value)) return new Set<string>()
    const ids = new Set<string>()
    events.value.forEach(e => {
      const pId = e.proposalId?._id || e.proposalId
      if (pId) ids.add(String(pId))
    })
    return ids
  })

  const acceptedProposals = computed(() => {
    return proposalList.value.filter(p => p.status === 'accepted' || (p as any).status === 'ACEITO')
  })

  const pendingSchedulingProposals = computed(() => {
    return acceptedProposals.value.filter(p => {
      if (p.executionDate) return false
      if (scheduledProposalIds.value.has(String(p._id))) return false
      return true
    })
  })

  const proposalOptions = computed(() => {
    const options = acceptedProposals.value.map(p => ({
      label: `✓ [ACEITO] #${p.code || 'S/N'} - ${p.title} (${p.client?.name || 'Cliente'})`,
      value: p._id
    }))

    const otherProposals = proposalList.value.filter(p => p.status !== 'accepted' && (p as any).status !== 'ACEITO')
    if (otherProposals.length > 0) {
      options.push(...otherProposals.map(p => ({
        label: `#${p.code || 'S/N'} - ${p.title} (${p.client?.name || 'Cliente'})`,
        value: p._id
      })))
    }
    return options
  })

  function onProposalSelect(proposalId: string) {
    if (!proposalId) return
    const p = proposalList.value.find(item => item._id === proposalId)
    if (!p) return

    if (!form.value.title || form.value.title.trim() === '') {
      form.value.title = `Execução: ${p.title}`
    }

    const clientInfo = p.client ? `Cliente: ${p.client.name}` : ''
    const phoneInfo = p.client?.phone ? `Telefone: ${p.client.phone}` : ''
    const emailInfo = p.client?.email ? `Email: ${p.client.email}` : ''
    const totalValue = p.total ? `Valor do Serviço: R$ ${Number(p.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''

    const details = [
      `Orçamento Aceito: #${p.code || 'S/N'}`,
      clientInfo,
      phoneInfo,
      emailInfo,
      totalValue,
      p.notes ? `Observações do Orçamento: ${p.notes}` : ''
    ].filter(Boolean).join('\n')

    if (!form.value.description || form.value.description.trim() === '') {
      form.value.description = details
    }
  }

  function handleDateSelect(selectInfo?: any) {
    selectedEvent.value = null
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)

    const rawStart = selectInfo?.startStr || todayStr
    const rawEnd = selectInfo?.endStr || rawStart

    const startIso = rawStart.includes('T')
      ? rawStart.slice(0, 16)
      : `${rawStart}T09:00`

    const endIso = rawEnd.includes('T')
      ? rawEnd.slice(0, 16)
      : `${rawStart}T10:00`

    form.value = {
      title: '',
      description: '',
      start: startIso,
      end: endIso,
      proposalId: '',
      allDay: selectInfo?.allDay ?? false,
      color: '#3B82F6'
    }
    isModalOpen.value = true
  }

  function handleEventClick(clickInfo: any) {
    const e = clickInfo.event.extendedProps
    selectedEvent.value = e
    form.value = {
      title: e.title,
      description: e.description || '',
      start: e.start ? new Date(e.start).toISOString().slice(0, 16) : '',
      end: e.end ? new Date(e.end).toISOString().slice(0, 16) : '',
      proposalId: e.proposalId?._id || e.proposalId || '',
      allDay: e.allDay || false,
      color: e.color || '#3B82F6'
    }
    isModalOpen.value = true
  }

  async function handleEventDrop(dropInfo: any) {
    const e = dropInfo.event
    try {
      await $fetch(`/api/events/${e.id}`, {
        method: 'PUT',
        body: {
          start: e.start?.toISOString(),
          end: e.end?.toISOString(),
          allDay: e.allDay
        }
      })
      notify('Compromisso Reagendado', 'Compromisso movido na agenda em segundo plano.', true)
    } catch (err) {
      dropInfo.revert()
      notify('Erro', 'Não foi possível mover o compromisso.')
    }
  }

  async function handleEventResize(resizeInfo: any) {
    const e = resizeInfo.event
    try {
      await $fetch(`/api/events/${e.id}`, {
        method: 'PUT',
        body: {
          start: e.start?.toISOString(),
          end: e.end?.toISOString()
        }
      })
      notify('Duração Atualizada', 'Duração do compromisso ajustada em segundo plano.', true)
    } catch (err) {
      resizeInfo.revert()
      notify('Erro', 'Erro ao alterar a duração.')
    }
  }

  const calendarOptions = computed(() => ({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    locale: ptBrLocale,
    buttonText: {
      today: 'Hoje',
      month: 'Mês',
      week: 'Semana',
      day: 'Dia'
    },
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: events.value?.map(e => ({
      id: e._id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.allDay,
      backgroundColor: e.color || '#3B82F6',
      borderColor: e.color || '#3B82F6',
      extendedProps: { ...e }
    })) || [],
    editable: true,
    selectable: true,
    select: handleDateSelect,
    eventClick: handleEventClick,
    eventDrop: handleEventDrop,
    eventResize: handleEventResize,
    height: 'auto'
  }))

  function openNewEventModal() {
    selectedEvent.value = null
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const currentHour = String(now.getHours()).padStart(2, '0')
    const nextHour = String((now.getHours() + 1) % 24).padStart(2, '0')

    form.value = {
      title: '',
      description: '',
      start: `${todayStr}T${currentHour}:00`,
      end: `${todayStr}T${nextHour}:00`,
      proposalId: '',
      allDay: false,
      color: '#3B82F6'
    }
    isModalOpen.value = true
  }

  async function saveEvent() {
    if (!validate()) return
    isSubmitting.value = true
    try {
      const method = selectedEvent.value ? 'PUT' : 'POST'
      const endpoint = selectedEvent.value ? `/api/events/${selectedEvent.value._id}` : '/api/events'

      await $fetch(endpoint, {
        method,
        body: form.value
      })
      isModalOpen.value = false
      refreshEvents()
      notify('Sucesso', selectedEvent.value ? 'Compromisso atualizado!' : 'Compromisso agendado com sucesso!')
    } catch (e: any) {
      notify('Erro', 'Ocorreu um erro ao salvar o compromisso.')
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteEvent() {
    if (!selectedEvent.value) return

    confirmAlert({
      title: 'Excluir Compromisso',
      description: 'Deseja excluir este compromisso permanentemente?',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await $fetch(`/api/events/${selectedEvent.value?._id}`, { method: 'DELETE' })
          isModalOpen.value = false
          refreshEvents()
          notify('Sucesso', 'Compromisso removido.')
        } catch (e) {
          notify('Erro', 'Erro ao excluir o compromisso.')
        }
      }
    })
  }

  const linkedProposal = computed(() => {
    if (!form.value.proposalId) return null
    return proposalList.value.find(p => p._id === form.value.proposalId)
  })

  return {
    events,
    refreshEvents,
    pendingEvents,
    proposalsData,
    pendingProposals,
    isModalOpen,
    isSubmitting,
    selectedEvent,
    form,
    proposalList,
    scheduledProposalIds,
    acceptedProposals,
    pendingSchedulingProposals,
    proposalOptions,
    onProposalSelect,
    calendarOptions,
    openNewEventModal,
    saveEvent,
    deleteEvent,
    linkedProposal,
    Plus,
    MapPin,
    CalendarIcon,
    Clock,
    FileText,
    Trash2,
    X,
    ExternalLink,
    CheckCircle2,
    User,
    Sparkles,
  }
}
