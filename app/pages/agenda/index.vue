<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import { useAgendaPage } from '~/composables/pages/useAgendaPage'

const {
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
} = useAgendaPage()
</script>

<template>
  <div class="space-y-8 relative">
    <PageHeader title="Agenda" subtitle="Organize seus atendimentos, reuniões e orçamentos aprovados num único local.">
      <BaseButton data-tour="agenda-novo-evento-btn" @click="openNewEventModal()" class="w-full sm:w-auto shadow-xl shadow-blue-500/10">
        <Plus class="w-5 h-5 mr-2" />
        Novo
      </BaseButton>
    </PageHeader>

    <!-- Card de Alerta de Orçamentos Aceitos Pendentes de Agendamento -->
    <div v-if="pendingSchedulingProposals.length > 0" class="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 p-4 rounded-[0.75rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
          <Sparkles class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-xs font-black text-blue-950 dark:text-blue-100">
            Você possui {{ pendingSchedulingProposals.length }} orçamento(s) aceito(s) aguardando agendamento!
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
    <div data-tour="agenda-calendario" class="bg-white dark:bg-gray-900 p-3 sm:p-8 rounded-[0.75rem] sm:rounded-[0.75rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <ClientOnly>
        <FullCalendar :options="calendarOptions" />
        <template #fallback>
          <div class="h-[550px] bg-gray-50 dark:bg-gray-800/40 rounded-[0.75rem] animate-pulse flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest">
            Carregando agenda...
          </div>
        </template>
      </ClientOnly>
    </div>

    <!-- Modal de Configuração de Evento -->
    <BaseDialog v-model:open="isModalOpen" :title="selectedEvent ? 'Editar Compromisso' : 'Novo Compromisso'" size="lg">
      <form id="event-form" @submit.prevent="saveEvent" class="space-y-6 py-2">
        <!-- Seleção de Orçamento Aceito / Qualquer Orçamento -->
        <div class="bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-[0.75rem] border border-gray-100 dark:border-gray-700/60 space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold tracking-wide text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
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
            <NuxtLink :to="`${linkedProposal.driveWebViewLink}`" target="_blank" class="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              Ver PDF <ExternalLink class="w-3 h-3" />
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
        <!-- <button
          v-if="selectedEvent"
          type="button"
          @click="deleteEvent"
          class="mr-auto flex items-center gap-2 text-xs font-black text-red-500 hover:text-red-700 dark:hover:text-red-400 uppercase tracking-widest transition-colors"
        >
          <Trash2 class="w-4 h-4" /> Excluir
        </button> -->
        <BaseButton v-if="selectedEvent" type="button" variant="danger" @click="deleteEvent">Excluir</BaseButton>
        <BaseButton type="button" variant="secondary" @click="isModalOpen = false">Cancelar</BaseButton>
        <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="saveEvent">
          {{ selectedEvent ? 'Salvar' : 'Cadastrar' }}
        </BaseButton>
      </template>
    </BaseDialog>
  </div>
</template>

<style src="~/composables/pages/agenda.css"></style>
