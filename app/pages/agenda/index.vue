<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { Plus, MapPin, Calendar as CalendarIcon, Clock, FileText, Trash2, X, ExternalLink, CheckCircle2, User, Sparkles } from 'lucide-vue-next'
import type { ProposalDTO } from '../../types'

const { notify, confirm: confirmAlert } = useAlerts()
const { data: events, refresh: refreshEvents, pending: pendingEvents } = useLazyFetch<any[]>('/api/events')
const { data: proposalsData, pending: pendingProposals } = useLazyFetch<any>('/api/proposals?limit=100')

const isModalOpen = ref(false)
const isSubmitting = ref(false)
const selectedEvent = ref<any>(null)

const form = ref({
  title: '',
  description: '',
  start: '',
  end: '',
  proposalId: '',
  allDay: false,
  color: '#3B82F6'
})

// Garantir extração correta de array de propostas de forma segura
const proposalList = computed<ProposalDTO[]>(() => {
  if (!proposalsData.value) return []
  if (Array.isArray(proposalsData.value)) return proposalsData.value
  if (Array.isArray(proposalsData.value.items)) return proposalsData.value.items
  return []
})

// Orçamentos com status Aceito
const acceptedProposals = computed(() => {
  return proposalList.value.filter(p => p.status === 'accepted' || (p as any).status === 'ACEITO')
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

  // Auto preencher título e descrição
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

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: ptBrLocale,
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
    notify('Sucesso', 'Compromisso reagendado com sucesso!')
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
    notify('Sucesso', 'Duração do compromisso atualizada!')
  } catch (err) {
    resizeInfo.revert()
    notify('Erro', 'Erro ao alterar a duração.')
  }
}

async function saveEvent() {
  if (!form.value.title) {
    notify('Atenção', 'Informe o título do compromisso.')
    return
  }
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
</script>

<template>
  <div class="space-y-8 relative">
    <PageHeader title="Sua Agenda" subtitle="Organize seus atendimentos, reuniões e orçamentos aprovados num único local.">
      <BaseButton data-tour="agenda-novo-evento-btn" @click="openNewEventModal()" class="w-full sm:w-auto shadow-xl shadow-blue-500/10">
        <Plus class="w-5 h-5 mr-2" />
        Novo Compromisso
      </BaseButton>
    </PageHeader>

    <!-- Card de Alerta de Orçamentos Aceitos Pendentes de Agendamento -->
    <div v-if="acceptedProposals.length > 0" class="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-xs font-black text-blue-950 dark:text-blue-100">
            Você possui {{ acceptedProposals.length }} orçamento(s) aceito(s) aguardando agendamento!
          </h4>
          <p class="text-[11px] font-medium text-blue-700 dark:text-blue-300">
            Selecione-os ao criar um novo evento para importar os dados do cliente e do serviço.
          </p>
        </div>
      </div>
      <BaseButton size="sm" variant="secondary" @click="openNewEventModal()" class="shrink-0 w-full sm:w-auto">
        Agendar Agora
      </BaseButton>
    </div>

    <!-- Container da Agenda (Dark Mode & Touch Ready) -->
    <div data-tour="agenda-calendario" class="bg-white dark:bg-gray-900 p-4 sm:p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <ClientOnly>
        <FullCalendar :options="calendarOptions" />
        <template #fallback>
          <div class="h-[550px] bg-gray-50 dark:bg-gray-800/40 rounded-3xl animate-pulse flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
            Carregando agenda...
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Modal de Configuração de Evento -->
    <BaseDialog v-model:open="isModalOpen" :title="selectedEvent ? 'Editar Compromisso' : 'Novo Compromisso'" size="lg">
      <form id="event-form" @submit.prevent="saveEvent" class="space-y-6 py-2">
        <!-- Seleção de Orçamento Aceito / Qualquer Orçamento -->
        <div class="bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/60 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <CheckCircle2 class="w-4 h-4 text-emerald-500" /> Vincular Orçamento Aceito
            </label>
            <span v-if="form.proposalId" class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Vinculado
            </span>
          </div>
          <BaseSelect
            v-model="form.proposalId"
            placeholder="Selecione um orçamento para importar os dados..."
            :options="proposalOptions"
            @update:modelValue="onProposalSelect"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <BaseInput v-model="form.title" label="Título do Compromisso" placeholder="Ex: Execução de Serviço - Cliente X" required />
          </div>
          <BaseInput v-model="form.start" type="datetime-local" label="Data e Hora de Início" required />
          <BaseInput v-model="form.end" type="datetime-local" label="Data e Hora de Término" required />
        </div>

        <!-- Card de Detalhes do Orçamento Vinculado -->
        <div v-if="linkedProposal" class="p-5 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText class="w-3.5 h-3.5" /> Orçamento Vinculado
            </h4>
            <NuxtLink :to="`/orcamentos/${linkedProposal._id}`" target="_blank" class="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Ver Detalhes <ExternalLink class="w-3 h-3" />
            </NuxtLink>
          </div>
          <div class="space-y-1">
            <p class="text-sm font-black text-gray-900 dark:text-gray-100">{{ linkedProposal.title }}</p>
            <p v-if="linkedProposal.client" class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 text-blue-500" />
              <span><strong>Cliente:</strong> {{ linkedProposal.client.name }} ({{ linkedProposal.client.phone || linkedProposal.client.email }})</span>
            </p>
            <p v-if="linkedProposal.total" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              Valor Total: R$ {{ Number(linkedProposal.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}
            </p>
          </div>
        </div>

        <BaseTextarea
          v-model="form.description"
          label="Observações / Detalhes do Serviço"
          :rows="4"
          placeholder="Descreva detalhes como endereço, instrução de acesso ou itens do serviço..."
        />
      </form>

      <template #footer>
        <button
          v-if="selectedEvent"
          type="button"
          @click="deleteEvent"
          class="mr-auto flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-700 dark:hover:text-red-400 uppercase tracking-widest transition-colors"
        >
          <Trash2 class="w-4 h-4" /> Excluir
        </button>
        <BaseButton type="button" variant="secondary" @click="isModalOpen = false">Cancelar</BaseButton>
        <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="saveEvent">
          {{ selectedEvent ? 'Salvar Alterações' : 'Criar Compromisso' }}
        </BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>

<style>
.fc {
  --fc-button-bg-color: #f9fafb;
  --fc-button-border-color: #f3f4f6;
  --fc-button-hover-bg-color: #f3f4f6;
  --fc-button-hover-border-color: #e5e7eb;
  --fc-button-active-bg-color: #e5e7eb;
  --fc-button-active-border-color: #d1d5db;
  --fc-button-text-color: #374151;
  --fc-border-color: #f3f4f6;
  --fc-today-bg-color: #eff6ff;
}

.dark .fc {
  --fc-button-bg-color: #1f2937;
  --fc-button-border-color: #374151;
  --fc-button-hover-bg-color: #374151;
  --fc-button-hover-border-color: #4b5563;
  --fc-button-active-bg-color: #374151;
  --fc-button-active-border-color: #4b5563;
  --fc-button-text-color: #f9fafb;
  --fc-border-color: #1f2937;
  --fc-today-bg-color: rgba(30, 58, 138, 0.25);
  --fc-page-bg-color: #111827;
  --fc-neutral-bg-color: #1f2937;
  --fc-list-event-hover-bg-color: #374151;
}

.fc .fc-toolbar-title {
  @apply text-lg sm:text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight;
}

.dark .fc .fc-col-header-cell-cushion,
.dark .fc .fc-daygrid-day-number,
.dark .fc .fc-list-day-text,
.dark .fc .fc-list-day-side-text {
  color: #9ca3af !important;
}

.dark .fc .fc-list-event-title,
.dark .fc .fc-list-event-time {
  color: #f3f4f6 !important;
}

.dark .fc .fc-list-empty {
  background-color: transparent !important;
  color: #9ca3af !important;
}

.fc .fc-button {
  @apply rounded-xl font-black uppercase text-[10px] tracking-widest px-3 py-2 transition-all shadow-none touch-manipulation;
}

.fc .fc-button-primary:not(:disabled).fc-button-active,
.fc .fc-button-primary:not(:disabled):active {
  @apply bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-600;
}

.fc .fc-daygrid-day-number {
  @apply font-black text-xs text-gray-400 dark:text-gray-500 p-2 sm:p-4;
}

.fc .fc-event {
  @apply rounded-lg border-none px-2 py-1 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform;
}

.fc .fc-event-title {
  @apply font-bold text-[10px] uppercase tracking-tight;
}
</style>
