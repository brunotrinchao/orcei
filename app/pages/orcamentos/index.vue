<script setup lang="ts">
import { useOrcamentosPage } from '~/composables/pages/useOrcamentosPage'

const {
  creditLabel,
  searchQuery,
  filterStatus,
  filterStartDate,
  filterEndDate,
  filterPendingChat,
  stagedFilterStatus,
  stagedFilterStartDate,
  stagedFilterEndDate,
  stagedFilterPendingChat,
  onOpenFilters,
  applyFilters,
  showProposalInfo,
  selectedProposalInfo,
  openProposalInfo,
  activeFiltersCount,
  clearFilters,
  proposals,
  totalProposals,
  pending,
  loadingMore,
  hasMore,
  loadMore,
  refresh,
  mobileSentinelRef,
  isModalOpen,
  isAIWizardOpen,
  isHistoryOpen,
  isChatOpen,
  isPaywallOpen,
  paywallReason,
  isContractModalOpen,
  contractProposal,
  localContractText,
  isSavingContract,
  copiedContractTag,
  isAcceptedModalOpen,
  isSuccessModalOpen,
  lastCreatedProposal,
  selectedProposal,
  selectedProposalHistory,
  isLoadingHistory,
  prefilledItems,
  isAiAssistedProposal,
  isSubmitting,
  isResending,
  proposalFormRef,
  siteOrigin,
  openChat,
  openHistory,
  canShowChatButton,
  canShowWhatsappButton,
  sendWhatsapp,
  resendEmail,
  shareProposal,
  openModal,
  onAIWizardSuccess,
  downloadPdf,
  openPreview,
  whatsappLink,
  handleProposalSubmit,
  statusMap,
  getStatusVariant,
  getProposalStatusLabel,
  formatDate,
  confirmDeleteProposal,
  contractVariables,
  openContractModal,
  copyContractTag,
  saveContract,
  Plus,
  Search,
  Mail,
  LinkIcon,
  Pencil,
  Share2,
  RefreshCcw,
  Loader2,
  FileText,
  ExternalLink,
  Eye,
  Download,
  CheckCircle2,
  MessageCircle,
  CreditCard,
  Banknote,
  History,
  Sparkles,
  Send,
  CheckCheck,
  X,
  ArrowLeft,
  ArrowRight,
  Trash2,
  MoreVertical,
  Check,
  Copy,
  Variable,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} = useOrcamentosPage()
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader>
      <div class="flex flex-row gap-3 w-full sm:w-auto justify-end">
        <BaseButton @click="isAIWizardOpen = true" variant="ia">
          <Sparkles class="w-4 h-4 mr-2 text-white animate-pulse" />
          Criar com IA
        </BaseButton>
        <BaseButton data-tour="orcamentos-novo-btn" @click="openModal()">
          <Plus class="w-5 h-5 mr-0 sm:mr-2" />
          <span class="hidden sm:inline">Novo</span>
        </BaseButton>
      </div>
    </PageHeader>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseCard>


      <template #header>
        <BaseFilters
          :active-filters-count="activeFiltersCount"
          @open="onOpenFilters"
          @apply="applyFilters"
          @clear="clearFilters"
          data-tour="orcamentos-filtros"
        >
          <template #search>
            <BaseInput v-model="searchQuery" type="text" placeholder="Buscar por título, cliente, e-mail ou código..."
              :icon="Search"></BaseInput>
          </template>
          <div class="w-full md:w-56 shrink-0">
            <BaseDateRangePicker v-model:start="stagedFilterStartDate" v-model:end="stagedFilterEndDate" />
          </div>

          <div class="w-full md:w-48 shrink-0">
            <BaseSelect v-model="stagedFilterStatus" :options="[
              { label: 'Todos os Status', value: '__EMPTY__' },
              ...Object.entries(statusMap).map(([value, info]: any) => ({
                label: info.label,
                value
              }))
            ]" placeholder="Todos os Status" />
          </div>

          <div
            class="flex items-center gap-3 px-5 h-[52px] bg-white dark:bg-gray-900  hover:border-gray-400 dark:hover:border-gray-700 transition-all group cursor-pointer shadow-xs shrink-0 rounded-[0.75rem]">
            <!-- Adicionado 'shrink-0' no checkbox para evitar que ele deforme -->
            <BaseCheckbox v-model="stagedFilterPendingChat" id="pending-chat" class="shrink-0" />

            <label for="pending-chat"
              class="text-xs font-normal text-slate-700 dark:text-gray-400 tracking-wide cursor-pointer group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors whitespace-nowrap select-none">
              Chat Pendente
            </label>
          </div>
        </BaseFilters>
      </template>
      <BaseDataList :columns="[
        { key: 'title', label: 'Orçamento' },
        { key: 'client', label: 'Cliente' },
        { key: 'createdAt', label: 'Data' },
        { key: 'status', label: 'Status', type: 'badge' },
        { key: 'total', label: 'Total', align: 'right', type: 'currency' }
      ]" :items="proposals || []" :pending="pending" :has-more="hasMore" :loading-more="loadingMore"
        @load-more="loadMore" empty-title="Sem Orçamentos"
        empty-subtitle="Clique no botão acima para criar seu primeiro orçamento.">
        <template #cell-title="{ item: proposal }">
          <div class="flex items-center gap-3 cursor-pointer" @click="openProposalInfo(proposal)">
            <div class="flex flex-col">
              <span
                class="font-normal text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-base tracking-tight">
                {{ proposal.title || 'Sem título' }}
              </span>
            </div>
          </div>
        </template>

        <template #cell-client="{ item: proposal }">
          <div class="flex flex-col cursor-pointer" @click="openProposalInfo(proposal)">
            <span class="text-md font-normal text-gray-900 tracking-wide mt-0.5">{{ proposal.client?.name }}</span>
            <span v-if="proposal.client?.email"
              class="text-[10px] text-gray-400 dark:text-gray-500 font-medium normal-case mt-0.5">{{
                proposal.client.email }}</span>
          </div>
        </template>

        <template #cell-createdAt="{ item: proposal }">
          <span class="text-xs md:text-sm text-gray-500 font-medium cursor-pointer" @click="openProposalInfo(proposal)">
            {{ formatDate(proposal.createdAt) }}
          </span>
        </template>

        <template #cell-status="{ item: proposal }">
          <div class="cursor-pointer" @click="openProposalInfo(proposal)">
            <BaseBadge :variant="getStatusVariant(proposal)" light>
              {{ getProposalStatusLabel(proposal) }}
            </BaseBadge>
          </div>
        </template>

        <template #cell-total="{ item: proposal }">
           <div class="flex flex-col items-start md:items-end cursor-pointer" @click="openProposalInfo(proposal)">
            <span class="font-normal text-base md:text-lg text-gray-900 dark:text-gray-100">
            R$ {{ proposal.totals?.final?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00' }}
          </span>
          </div>
        </template>
      </BaseDataList>
    </BaseCard>

    <!-- Modal de Informações Detalhadas do Orçamento -->
    <ProposalDetailModal v-model:open="showProposalInfo" :proposal="selectedProposalInfo" :is-resending="isResending"
      @edit="p => { showProposalInfo = false; openModal(p) }" @history="p => { openHistory(p) }"
      @download-pdf="p => { downloadPdf(p) }" @resend-email="p => { resendEmail(p) }"
      @edit-contract="p => { showProposalInfo = false; openContractModal(p) }"
      @delete="p => { showProposalInfo = false; confirmDeleteProposal(p) }" />

    <!-- Modal de Orçamento -->
    <BaseDialog v-model:open="isModalOpen" :title="selectedProposal ? 'Editar Orçamento' : 'Novo Orçamento'" size="xl">
      <ProposalForm ref="proposalFormRef" :initial-data="selectedProposal || undefined"
        :prefilled-items="prefilledItems || undefined" :is-editing="!!selectedProposal" :is-submitting="isSubmitting"
        @submit="handleProposalSubmit" />
      <template #footer>
        <!-- Voltar -->
        <BaseButton v-if="proposalFormRef?.currentStep > 1" type="button" variant="secondary"
          @click="proposalFormRef.prevStep()" :disabled="isSubmitting">
          <ArrowLeft class="w-4 h-4 mr-2" /> Voltar
        </BaseButton>

        <div class="flex-1"></div>

        <!-- Total Parcial no passo 2 -->
        <div v-if="proposalFormRef?.currentStep === 2" class="hidden sm:block text-center mr-4">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total Parcial</span>
          <span class="text-lg font-black text-blue-600">R$ {{ (proposalFormRef?.scopeTotal ||
            0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
        </div>

        <!-- Próximo (Passo < totalSteps) -->
        <BaseButton v-if="proposalFormRef?.currentStep < proposalFormRef?.totalSteps" type="button" variant="primary"
          :disabled="proposalFormRef?.isStepInvalid" @click.prevent="proposalFormRef.nextStep()">
          Próximo
          <ArrowRight class="w-4 h-4 ml-2" />
        </BaseButton>

        <!-- Finalizar (Último passo) -->
        <template v-else-if="proposalFormRef?.currentStep === proposalFormRef?.totalSteps">
          <template v-if="proposalFormRef?.isEditingNonDraft">
            <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting"
              @click="proposalFormRef.submit()">
              Salvar Alterações
            </BaseButton>
          </template>
          <template v-else>
            <BaseButton type="button" variant="outline" :disabled="isSubmitting"
              @click="proposalFormRef.submit('draft')">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
              Salvar Rascunho
            </BaseButton>
            <BaseButton type="button" :disabled="isSubmitting" @click="proposalFormRef.submit('created')"
              class="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200">
              <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin mr-2" />
              {{ creditLabel('proposalSend', 'Criar e Enviar') }}
            </BaseButton>
          </template>
        </template>
      </template>
    </BaseDialog>

    <!-- Modal Proposta Aceita -->
    <BaseDialog v-model:open="isAcceptedModalOpen" title="Proposta Aceita" size="xl" @close="selectedProposal = null">
      <div v-if="selectedProposal" class="">
        <div class="bg-green-500 rounded-[0.75rem] p-6 flex items-center gap-4 mb-6">
          <div class="w-14 h-14 bg-white/20 rounded-[0.75rem] flex items-center justify-center shrink-0">
            <CheckCircle2 class="w-8 h-8 text-white" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[10px] font-black text-green-100 uppercase tracking-widest mb-1">Orçamento Aceito</p>
            <h3 class="text-xl font-black text-white tracking-tight truncate">{{ selectedProposal.title ||
              selectedProposal.code }}</h3>
            <p class="text-sm text-green-100 font-medium mt-0.5">{{ selectedProposal.code }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-[10px] font-black text-green-100 uppercase tracking-widest mb-1">Total</p>
            <p class="text-2xl font-black text-white">R$ {{ selectedProposal.totals.final.toLocaleString('pt-BR', {
              minimumFractionDigits: 2 }) }}</p>
          </div>
        </div>

        <div class="bg-gray-50 dark:bg-gray-900/60 rounded-[0.75rem] p-6 mb-4">
          <p class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Cliente</p>
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-blue-100 dark:bg-blue-950/50 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg">
                {{ selectedProposal.client.name.charAt(0) }}
              </div>
              <div>
                <p class="font-black text-gray-900 dark:text-gray-100">{{ selectedProposal.client.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">{{ selectedProposal.client.email }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <a :href="`mailto:${selectedProposal.client.email}`"
                class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-900 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-gray-600 dark:text-gray-300">
                <Mail class="w-4 h-4" /> E-mail
              </a>
              <a v-if="selectedProposal.client.phone" :href="whatsappLink(selectedProposal.client.phone)"
                target="_blank"
                class="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-green-100 dark:shadow-none">
                <img :src="'/images/icons/whatsapp-svg.svg'" class="w-4 h-4" alt="WhatsApp" loading="lazy" /> WhatsApp
              </a>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-[0.75rem] mb-4">
          <CreditCard v-if="selectedProposal.paymentConfig?.method === 'credit_card'"
            class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <Banknote v-else class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <p class="text-sm font-black text-blue-900 dark:text-blue-200">
            {{ selectedProposal.paymentConfig?.method === 'credit_card'
              ? `Cartão de Crédito — ${selectedProposal.paymentConfig.installments}x`
              : `À Vista (${selectedProposal.paymentConfig?.cashDiscount}% desconto)` }}
          </p>
        </div>

        <div class="border border-gray-100 dark:border-gray-800 rounded-[0.75rem] overflow-hidden mb-4">
          <div class="px-5 py-3 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
            <p class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Itens do
              Orçamento
            </p>
          </div>
          <div class="divide-y divide-gray-50 dark:divide-gray-800/60">
            <div v-for="item in selectedProposal.items" :key="item._id"
              class="flex justify-between items-start px-5 py-4 gap-4">
              <div class="flex-1 min-w-0">
                <p class="font-black text-gray-900 dark:text-gray-100 text-sm">{{ item.name }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5 truncate">{{ item.description }}
                </p>
              </div>
              <div class="text-right shrink-0">
                <p class="font-black text-gray-900 dark:text-gray-100 text-sm">R$ {{ (item.price *
                  item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
                <p class="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{{ item.quantity }}x R$ {{
                  item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
              </div>
            </div>
          </div>
          <div
            class="flex justify-between items-center px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40">
            <span class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total
              Final</span>
            <span class="font-black text-green-600 dark:text-green-400 text-lg">R$ {{
              selectedProposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <a :href="selectedProposal ? `${siteOrigin}/p/${selectedProposal.slug}${selectedProposal.token ? `?t=${selectedProposal.token}` : ''}` : '#'"
          target="_blank"
          class="mr-auto flex items-center gap-2 text-xs font-black text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">
          <ExternalLink class="w-4 h-4" /> Ver link público
        </a>
        <BaseButton variant="secondary" size="sm" @click="isAcceptedModalOpen = false">Fechar</BaseButton>
      </template>
    </BaseDialog>

    <AIProposalWizard v-model:open="isAIWizardOpen" @close="isAIWizardOpen = false" @success="onAIWizardSuccess" />

    <!-- Modal de Sucesso (WhatsApp) -->
    <BaseDialog v-model:open="isSuccessModalOpen" title="Orçamento Criado!" size="md">
      <div v-if="lastCreatedProposal" class="p-6 text-center space-y-6">
        <div class="w-20 h-20 bg-green-50 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 class="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>

        <div class="space-y-2">
          <h3 class="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight uppercase">Tudo Pronto!</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">O orçamento foi criado e o e-mail de
            notificação
            já foi enviado para o cliente.</p>
        </div>

        <div
          class="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-[0.75rem] border border-blue-100 dark:border-blue-900/30 flex items-center gap-4 text-left">
          <div class="w-10 h-10 bg-green-50 dark:bg-green-950/40 rounded-xl flex items-center justify-center shrink-0">
            <img :src="'/images/icons/whatsapp-svg.svg'" class="w-6 h-6" alt="WhatsApp" loading="lazy" />
          </div>
          <div>
            <p class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Dica Pro</p>
            <p class="text-xs text-blue-800 dark:text-blue-300 font-bold">Enviar também pelo WhatsApp aumenta em 3x a
              velocidade de aprovação.</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-3">
          <BaseButton class="w-full bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-100"
            @click="sendWhatsapp(lastCreatedProposal)">
            <img :src="'/images/icons/whatsapp-svg.svg'" class="w-5 h-5 mr-2" alt="WhatsApp" loading="lazy" />
            Enviar via WhatsApp
          </BaseButton>
          <BaseButton variant="secondary" class="w-full" @click="isSuccessModalOpen = false">
            Agora Não
          </BaseButton>
        </div>
      </div>
    </BaseDialog>

    <!-- Modal de Histórico -->
    <BaseDialog v-model:open="isHistoryOpen" title="Ciclo de Vida do Orçamento" size="lg">
      <div v-if="selectedProposal" class="p-6">
        <div class="mb-8 flex items-center justify-between">
          <div>
            <h3 class="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">{{ selectedProposal.title }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">{{ selectedProposal.client.name }} • {{
              selectedProposal.code }}</p>
          </div>
          <BaseBadge light :variant="getStatusVariant(selectedProposal)">
            {{ getProposalStatusLabel(selectedProposal) }}
          </BaseBadge>
        </div>

        <div v-if="isLoadingHistory" class="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 class="w-10 h-10 text-blue-600 animate-spin" />
          <p class="text-sm text-gray-500 font-bold animate-pulse">Carregando histórico...</p>
        </div>
        <ProposalTimeline v-else :history="selectedProposalHistory" />

        <div v-if="!isLoadingHistory && selectedProposalHistory.length === 0" class="py-10 text-center">
          <p class="text-gray-400 text-sm italic">Nenhum evento registrado ainda.</p>
        </div>
      </div>
    </BaseDialog>


    <!-- Modal Editar Contrato -->
    <BaseDialog v-model:open="isContractModalOpen" title="Editar Contrato" size="xl">
      <div class="p-6 space-y-6">
        <!-- Variáveis -->
        <div
          class="p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-[0.75rem] border border-slate-100 dark:border-slate-800">
          <div class="flex items-center gap-2 mb-3">
            <Variable class="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <h3 class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Variáveis
              Dinâmicas
            </h3>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
            Clique em uma variável para copiá-la. Ela será substituída automaticamente no contrato gerado.
          </p>
          <div class="flex flex-wrap gap-2">
            <button v-for="v in contractVariables" :key="v.tag" type="button" @click="copyContractTag(v.tag)"
              :title="v.desc"
              class="group flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all">
              <span
                class="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400">{{
                v.tag }}</span>
              <Check v-if="copiedContractTag === v.tag" class="w-3 h-3 text-emerald-500" />
              <Copy v-else class="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-400" />
            </button>
          </div>
        </div>

        <!-- Editor -->
        <div class="space-y-2">
          <label
            class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Contrato</label>
          <LazyRichTextEditor v-model="localContractText"
            class="min-h-[350px] border-2 border-gray-50 dark:border-gray-800 rounded-[0.75rem] overflow-hidden" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="isContractModalOpen = false">Cancelar</BaseButton>
        <BaseButton @click="saveContract" :disabled="isSavingContract">
          <Loader2 v-if="isSavingContract" class="w-4 h-4 animate-spin mr-2" />
          {{ isSavingContract ? 'Salvando...' : 'Salvar Contrato' }}
        </BaseButton>
      </template>
    </BaseDialog>

    <!-- Modal de Chat/Interação -->
    <LazyProposalChatModal v-model:open="isChatOpen" :proposal="selectedProposal" @refresh="refresh" />
    <!-- Modal de Paywall Express -->
    <PaywallExpressModal v-model:open="isPaywallOpen" :reason="paywallReason" />

  </div>
</template>
