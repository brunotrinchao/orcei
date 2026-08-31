<script setup lang="ts">
import { useClientesPage } from '~/composables/pages/useClientesPage'

const {
  searchQuery,
  clients,
  totalClients,
  pending,
  loadingMore,
  hasMore,
  loadMore,
  refresh,
  mobileSentinelRef,
  showForm,
  showInfo,
  selectedClient,
  clientStats,
  loadingStats,
  form,
  isSubmitting,
  isSearchingZip,
  openInfoModal,
  formatCurrency,
  formatDate,
  getProposalStatusLabel,
  getStatusVariant,
  getStatusBadge,
  formattedAddress,
  openModal,
  searchZip,
  saveClient,
  deleteClient,
  activeFiltersCount,
  clearFilters,
  formatPhone,
  stateMap,
  Search,
  Plus,
  Pencil,
  Trash2,
  RefreshCcw,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  MoreVertical,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  User,
  Building2,
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} = useClientesPage()
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader>
      <div class="flex flex-row gap-3 w-full sm:w-auto justify-end">
        <BaseButton type="button" variant="outline" @click="navigateTo('/configuracoes?section=multiplos-cadastros')">
          <Upload class="w-4 h-4 mr-2" />
          Importar
        </BaseButton>

        <BaseButton data-tour="clientes-novo-btn" @click="openModal()">
          <Plus class="w-5 h-5 mr-0 sm:mr-2" />
          <span class="hidden sm:inline">Novo</span>
        </BaseButton>

      </div>
    </PageHeader>

    <!-- Modal de Info do Cliente -->
    <BaseDialog v-model:open="showInfo" :title="selectedClient?.name || 'Detalhes do Cliente'" size="xl">
      <template #context-menu>
        <BaseDropdownMenu v-if="selectedClient">
          <BaseDropdownMenuItem @click="openModal(selectedClient)">
            <Pencil class="w-4 h-4 text-gray-500" />
            <span>Editar</span>
          </BaseDropdownMenuItem>
          <BaseDropdownMenuItem v-if="selectedClient.email" :href="`mailto:${selectedClient.email}`">
            <Mail class="w-4 h-4 text-gray-500" />
            <span>Enviar E-mail</span>
          </BaseDropdownMenuItem>
          <BaseDropdownMenuItem v-if="selectedClient.phone"
            :href="selectedClient.isWhatsapp ? `https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}` : `tel:${selectedClient.phone}`"
            target="_blank">
            <img v-if="selectedClient.isWhatsapp" src="/images/icons/whatsapp-svg.svg" class="w-4 h-4 grayscale"
              alt="WhatsApp" />
            <Phone v-else class="w-4 h-4 text-gray-500" />
            <span>{{ selectedClient.isWhatsapp ? 'WhatsApp' : 'Ligar' }}</span>
          </BaseDropdownMenuItem>
          <BaseDropdownMenuItem variant="danger" @click="deleteClient(selectedClient._id)">
            <Trash2 class="w-4 h-4 text-red-500" />
            <span>Excluir</span>
          </BaseDropdownMenuItem>
        </BaseDropdownMenu>
      </template>

      <div v-if="selectedClient" class="space-y-6 py-2">
        <BaseCard compact color="slate">

          <div class="flex  gap-4 items-center content-center">
            <div
              class="hidden sm:flex w-20 h-20 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white text-xl font-black shrink-0">
              {{ selectedClient.name?.substring(0, 2).toUpperCase() }}
            </div>
            <div class="flex gap-1 grid sm:grid-cols-3 grid-cols-1">
              <div>
                <h3 class="font-semibold tracking-normal text-lg text-gray-700">{{ selectedClient.name }}</h3>
                <p class="font-base tracking-wide text-sm text-gray-500">{{ selectedClient.taxId }}</p>
              </div>
              <div>
                <h3 class="font-semibold tracking-normal text-lg text-gray-700">{{ selectedClient.email }}</h3>
                <p class="font-base tracking-wide text-sm text-gray-500">{{ selectedClient.phone }}</p>
              </div>
              <div>
                <p class="font-base tracking-wide text-xs text-gray-500">{{ formattedAddress }}</p>
              </div>
            </div>
          </div>
        </BaseCard>

        <!-- Cards de Métricas Comerciais -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Orçamentos -->
          <BaseMetricCard color="sky" title="Orçamentos" subtitle="Histórico cadastrado"
            :value="clientStats?.stats?.totalProposals || 0" :icon="FileText" variant></BaseMetricCard>

          <!-- Fechados / Aprovados -->
          <BaseMetricCard color="green" title="Fechados" :subtitle="(clientStats?.stats?.acceptedCount || 0) + ((clientStats?.stats?.acceptedCount === 1) ? ' orçamento' :
            ' orçamentos')" :value="formatCurrency(clientStats?.stats?.acceptedTotalValue)" :icon="CheckCircle2"
            variant></BaseMetricCard>

          <!-- Em Aberto -->
          <BaseMetricCard color="amber" title="Em Aberto" :subtitle="(clientStats?.stats?.pendingCount || 0) + ((clientStats?.stats?.pendingCount === 1) ? ' aguardando' :
            ' aguardando')" :value="formatCurrency(clientStats?.stats?.pendingTotalValue)" :icon="Clock" variant>
          </BaseMetricCard>

          <!-- Recusados / Expirados -->
          <BaseMetricCard color="rose" title="Recusados" :subtitle="(clientStats?.stats?.expiredCount || 0) + ((clientStats?.stats?.expiredCount >= 0) ? ' recusado' :
            ' recusados')" :value="formatCurrency(clientStats?.stats?.expiredTotalValue)" :icon="Clock" variant>
          </BaseMetricCard>
        </div>

        <!-- Indicadores Comerciais Adicionais (Taxa de Conversão & Ticket Médio) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="p-4 rounded-[.5rem] bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-[.5rem] bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <TrendingUp class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-semibold">Taxa de Conversão</p>
                <p class="text-lg font-black text-gray-900 dark:text-gray-100">
                  {{ clientStats?.stats?.conversionRate || 0 }}% das propostas fechadas
                </p>
              </div>
            </div>
          </div>

          <div
            class="p-4 rounded-[.5rem] bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-[.5rem] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <DollarSign class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-semibold">Ticket Médio Fechado</p>
                <p class="text-lg font-black text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(clientStats?.stats?.avgTicket) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabela de Orçamentos Recentes -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide">Últimos
              Orçamentos</h3>
          </div>

          <div v-if="loadingStats" class="space-y-2">
            <BaseSkeleton v-for="i in 3" :key="i" height="3rem" borderRadius="12px" />
          </div>

          <div v-else-if="!clientStats?.recentProposals || clientStats.recentProposals.length === 0"
            class="p-6 text-center bg-gray-50 dark:bg-gray-900/40 rounded-[12px] border border-gray-100 dark:border-gray-800 ">
            <p class="text-xs font-bold text-gray-500">Nenhum orçamento emitido para este cliente ainda.</p>
          </div>

          <div v-else class="space-y-2">
            <BaseDataList :columns="[
              { key: 'title', label: 'Orçamento' },
              { key: 'createdAt', label: 'Data' },
              { key: 'status', label: 'Status', type: 'badge' },
              { key: 'total', label: 'Total', align: 'right', type: 'currency' }
            ]" :items="clientStats.recentProposals || []" empty-title="Sem Orçamentos"
              empty-subtitle="Comece criando seu primeiro orçamento para este cliente.">
              <template #cell-title="{ item: proposal }">
                <div class="flex items-center gap-3 cursor-pointer"
                  @click="navigateTo(`/orcamentos?search=${encodeURIComponent(proposal.title || '')}`)">
                  <div class="flex flex-col">
                    <span
                      class="font-normal text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-base tracking-tight">
                      {{ proposal.title || 'Sem título' }}
                    </span>
                  </div>
                </div>
              </template>

              <template #cell-createdAt="{ item: proposal }">
                <span class="text-xs md:text-sm text-gray-500 font-medium cursor-pointer"
                  @click="navigateTo(`/orcamentos?search=${encodeURIComponent(proposal.title || '')}`)">
                  {{ formatDate(proposal.createdAt) }}
                </span>
              </template>

              <template #cell-status="{ item: proposal }">
                <div class="cursor-pointer"
                  @click="navigateTo(`/orcamentos?search=${encodeURIComponent(proposal.title || '')}`)">
                  <BaseBadge :variant="getStatusVariant(proposal)" light>
                    {{ getProposalStatusLabel(proposal) }}
                  </BaseBadge>
                </div>
              </template>

              <template #cell-total="{ item: proposal }">
                <span
                  class="font-normal text-gray-900 dark:text-gray-100 text-xs md:text-base tracking-tight cursor-pointer"
                  @click="navigateTo(`/orcamentos?search=${encodeURIComponent(proposal.title || '')}`)">
                  {{ formatCurrency(proposal.totals?.final || 0) }}
                </span>
              </template>
            </BaseDataList>
          </div>


        </div>
      </div>

      <template v-if="selectedClient?.email || selectedClient?.name"  #footer>
          <NuxtLink :to="`/orcamentos?search=${encodeURIComponent(selectedClient.email || selectedClient.name)}`"
            class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            Ver todos os orçamentos
            <ExternalLink class="w-3 h-3" />
          </NuxtLink>

      </template>
    </BaseDialog>

    <!-- Modal de Formulário -->
     <BaseDrawer v-model:open="showForm" :title="selectedClient ? 'Editar Cliente' : 'Novo Cliente'" size="xl">
          <form id="client-form" @submit.prevent="saveClient" class="space-y-8 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput v-model="form.name" label="Nome Completo / Razão Social" placeholder="Ex: João Silva" required />
          <BaseInput v-model="form.taxId" label="CPF / CNPJ" placeholder="000.000.000-00" mask="document" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput v-model="form.email" type="email" label="E-mail" placeholder="cliente@email.com" required />
          <div class="space-y-3">
            <BaseInput v-model="form.phone" label="Telefone / Celular" placeholder="(00) 00000-0000" mask="phone" />
            <div class="flex items-center gap-3 ml-2">
              <BaseCheckbox v-model="form.isWhatsapp" id="isWhatsapp" />
              <label for="isWhatsapp"
                class="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                Este número possui WhatsApp
              </label>
            </div>
          </div>
        </div>

        <div
          class="bg-gray-50/50 dark:bg-gray-900/60 p-6 rounded-[12px] border border-gray-100 dark:border-gray-800 space-y-6">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em]">Endereço de
              Cobrança</h3>
            <div v-if="isSearchingZip"
              class="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 animate-pulse uppercase tracking-widest">
              <RefreshCcw class="w-3 h-3 animate-spin" />
              Buscando...
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseInput v-model="form.address.zip" label="CEP (opcional)" placeholder="00000-000" mask="cep"
              @update:model-value="searchZip" />
            <div class="md:col-span-2">
              <BaseInput v-model="form.address.street" label="Logradouro" placeholder="Rua, Avenida..." />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseInput v-model="form.address.number" label="Número / Comp." placeholder="123, Bloco A..." />
            <div class="md:col-span-2">
              <BaseInput v-model="form.address.neighborhood" label="Bairro" placeholder="Ex: Centro" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput v-model="form.address.city" label="Cidade" placeholder="Ex: São Paulo" />
            <BaseSelect v-model="form.address.state" placeholder="Ex: SP" label="Estado" :options="[
              { label: 'Selecione o Estado', value: '__EMPTY__' },
              ...Object.entries(stateMap).map(([value, info]: any) => ({
                label: info.label,
                value: value.toUpperCase()
              }))
            ]" />
          </div>
        </div>

        <BaseTextarea v-model="form.notes" label="Notas Internas (opcional)" :rows="3"
          placeholder="Alguma observação sobre este cliente..." />

      </form>

      <template #footer>
        <BaseButton variant="ghost" size="md" @click="showForm = false" :disabled="isSubmitting">
          Cancelar
        </BaseButton>
        <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="saveClient">
          {{ selectedClient ? 'Salvar' : 'Cadastrar' }}
        </BaseButton>
      </template>
    </BaseDrawer>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseCard>
      <template #header>
        <BaseFilters :active-filters-count="activeFiltersCount" @clear="clearFilters" data-tour="clientes-busca">
          <template #search>
            <BaseInput v-model="searchQuery" type="text" placeholder="Buscar por nome, e-mail ou documento..."
              :icon="Search"></BaseInput>
          </template>
        </BaseFilters>
      </template>
      <BaseDataList :columns="[
        { key: 'name', label: 'Cliente' },
        { key: 'contact', label: 'Contato' },
        { key: 'location', label: 'Localização' },
        // { key: 'actions', label: '', align: 'right' }
      ]" :items="clients || []" :pending="pending" :has-more="hasMore" :loading-more="loadingMore"
        @load-more="loadMore" empty-title="Sem Clientes"
        empty-subtitle="Sua lista de clientes aparecerá aqui. Comece cadastrando o primeiro.">
        <template #cell-name="{ item: client }">
          <div class="flex flex-col cursor-pointer" @click="openInfoModal(client)">
            <span
              class="font-normal text-base md:text-lg text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {{ client.name }}
            </span>
            <span class="text-[10px] font-normal text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
              {{ client.taxId || 'Sem documento' }}
            </span>
          </div>
        </template>

        <template #cell-contact="{ item: client }">
          <div class="flex flex-col cursor-pointer" @click="openInfoModal(client)">
            <span class="text-xs md:text-sm font-bold text-gray-600 dark:text-gray-300">
              {{ client.email }}
            </span>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs font-normal text-gray-400 dark:text-gray-500">
                {{ formatPhone(client.phone) }}
              </span>
              <img v-if="client.isWhatsapp" :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5" alt="WhatsApp"
                loading="lazy" />
            </div>
          </div>
        </template>

        <template #cell-location="{ item: client }">
          <div class="flex flex-col cursor-pointer" @click="openInfoModal(client)">
            <span class="text-[10px] font-normal text-gray-900 dark:text-gray-100 uppercase tracking-widest">
              {{ client.address?.city || '-' }} - {{ client.address?.state || '-' }}
            </span>
            <span
              class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest line-clamp-1 max-w-[400px] mt-0.5">
              {{ client.address?.street ? `${client.address?.street}, ${client.address?.number}` : '' }}
            </span>
          </div>
        </template>

        <!-- <template #cell-actions="{ item: client }">
        <div class="flex justify-end gap-3 items-center hidden sm:inline" @click.stop>
          <DropdownMenuRoot>
            <DropdownMenuTrigger as-child>
              <button
                @click.stop
                class="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[0.75rem] transition-all"
                title="Mais ações"
                aria-label="Mais ações do cliente"
              >
                <MoreVertical class="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                align="end"
                :side-offset="6"
                class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50"
              >
                <DropdownMenuItem
                  @click.stop="openInfoModal(client)"
                  class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
                >
                  <User class="w-4 h-4" />
                  Ver Detalhes
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click.stop="openModal(client)"
                  class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
                >
                  <Pencil class="w-4 h-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  @click.stop="deleteClient(client._id)"
                  class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-red-600 dark:hover:text-red-400 cursor-pointer outline-none transition-all"
                >
                  <Trash2 class="w-4 h-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </div>
      </template> -->
      </BaseDataList>
    </BaseCard>
  </div>
</template>
