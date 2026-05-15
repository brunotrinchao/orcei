<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import { Plus, MapPin, Calendar, Clock, FileText, Trash2, X } from 'lucide-vue-next'
import type { ProposalDTO } from '../../../../types'

const { data: events, refresh: refreshEvents } = useFetch<any[]>('/api/events')
const { data: proposals } = useFetch<ProposalDTO[]>('/api/proposals')

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
    backgroundColor: e.color,
    borderColor: e.color,
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

function handleDateSelect(selectInfo: any) {
  selectedEvent.value = null
  form.value = {
    title: '',
    description: '',
    start: selectInfo.startStr,
    end: selectInfo.endStr,
    proposalId: '',
    allDay: selectInfo.allDay,
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
    start: new Date(e.start).toISOString().slice(0, 16),
    end: new Date(e.end).toISOString().slice(0, 16),
    proposalId: e.proposalId?._id || e.proposalId || '',
    allDay: e.allDay,
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
  } catch (err) {
    dropInfo.revert()
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
  } catch (err) {
    resizeInfo.revert()
  }
}

async function saveEvent() {
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
  } catch (e: any) {
    alert('Erro ao salvar evento')
  } finally {
    isSubmitting.value = false
  }
}

async function deleteEvent() {
  if (!selectedEvent.value || !confirm('Deseja excluir este compromisso?')) return
  try {
    await $fetch(`/api/events/${selectedEvent.value._id}`, { method: 'DELETE' })
    isModalOpen.value = false
    refreshEvents()
  } catch (e) {
    alert('Erro ao excluir')
  }
}

const linkedProposal = computed(() => {
  if (!form.value.proposalId) return null
  return proposals.value?.find(p => p._id === form.value.proposalId)
})

const proposalOptions = computed(() => {
  return proposals.value?.map(p => ({
    label: `${p.code || 'S/N'} - ${p.title} (${p.client.name})`,
    value: p._id
  })) || []
})
</script>

<template>
  <div class="space-y-8">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Sua Agenda</h1>
        <p class="text-gray-500 font-medium">Organize seus serviços e reuniões de forma integrada.</p>
      </div>
      <BaseButton @click="isModalOpen = true" class="shadow-xl shadow-blue-100">
        <Plus class="w-5 h-5 mr-2" />
        Novo Compromisso
      </BaseButton>
    </header>

    <div class="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- Modal de Evento -->
    <BaseDialog v-model:open="isModalOpen" :title="selectedEvent ? 'Detalhes do Compromisso' : 'Novo Compromisso'" size="lg">
      <form @submit.prevent="saveEvent" class="space-y-6 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2">
            <BaseInput v-model="form.title" label="Título" placeholder="Ex: Entrega do Projeto X" required />
          </div>
          <BaseInput v-model="form.start" type="datetime-local" label="Início" required />
          <BaseInput v-model="form.end" type="datetime-local" label="Término" required />
          
          <div class="md:col-span-2">
            <BaseSelect 
              v-model="form.proposalId" 
              label="Vincular Orçamento" 
              placeholder="Selecione um orçamento..."
              :options="proposalOptions"
            />
          </div>
        </div>

        <div v-if="linkedProposal" class="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-[10px] font-black text-blue-600 uppercase tracking-widest">Orçamento Vinculado</h3>
            <NuxtLink :to="`/dashboard/proposals`" class="text-[9px] font-black text-blue-400 hover:text-blue-600 uppercase">Ver Orçamento</NuxtLink>
          </div>
          <div class="flex flex-col gap-1">
            <span class="font-bold text-gray-900">{{ linkedProposal.title }}</span>
            <span class="text-xs text-gray-500">{{ linkedProposal.client.name }}</span>
          </div>
          <div v-if="linkedProposal.client" class="flex flex-col gap-3 pt-2">
            <div class="flex items-start gap-2 text-xs text-gray-600">
              <MapPin class="w-3.5 h-3.5 mt-0.5 shrink-0 text-blue-500" />
              <span>
                Local do Atendimento: <br>
                {{ linkedProposal.client.email }} <!-- Using email as placeholder for missing client address in ProposalDTO if not populated -->
              </span>
            </div>
            <a 
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(linkedProposal.client.name)}`" 
              target="_blank"
              class="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm w-fit"
            >
              <ExternalLink class="w-3 h-3" /> Abrir no Google Maps
            </a>
          </div>
        </div>

        <div class="space-y-2">
          <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Observações</label>
          <textarea 
            v-model="form.description" 
            rows="3" 
            class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300"
            placeholder="Detalhes adicionais..."
          ></textarea>
        </div>

        <div class="flex justify-between items-center pt-6">
          <button 
            v-if="selectedEvent" 
            type="button" 
            @click="deleteEvent"
            class="text-red-500 hover:text-red-700 text-xs font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Trash2 class="w-4 h-4" /> Excluir
          </button>
          <div v-else></div>

          <div class="flex gap-4">
            <BaseButton type="button" variant="secondary" @click="isModalOpen = false">Cancelar</BaseButton>
            <BaseButton type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Salvando...' : (selectedEvent ? 'Atualizar' : 'Agendar') }}
            </BaseButton>
          </div>
        </div>
      </form>
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

.fc .fc-toolbar-title {
  @apply text-xl font-black text-gray-900 uppercase tracking-tight;
}

.fc .fc-button {
  @apply rounded-xl font-black uppercase text-[10px] tracking-widest px-4 py-2 transition-all shadow-none;
}

.fc .fc-button-primary:not(:disabled).fc-button-active, 
.fc .fc-button-primary:not(:disabled):active {
  @apply bg-gray-900 border-gray-900 text-white;
}

.fc .fc-daygrid-day-number {
  @apply font-black text-xs text-gray-400 p-4;
}

.fc .fc-event {
  @apply rounded-lg border-none px-2 py-1 shadow-sm cursor-pointer hover:scale-[1.02] transition-transform;
}

.fc .fc-event-title {
  @apply font-bold text-[10px] uppercase tracking-tight;
}
</style>
