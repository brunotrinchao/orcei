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
    <PageHeader title="Clientes" subtitle="Gerencie seus contatos e acelere seus orçamentos.">
      <div class="flex flex-row gap-3 w-full sm:w-auto">
        <BaseButton
          type="button"
          variant="outline"
          class="w-4/6  sm:w-auto"
          @click="navigateTo('/configuracoes?section=multiplos-cadastros')"
        >
          <Upload class="w-4 h-4 mr-2" />
          Importar
        </BaseButton>

        <BaseButton data-tour="clientes-novo-btn" @click="openModal()" class="w-2/6 sm:w-auto shadow-2xl shadow-blue-100">
          <Plus class="w-5 h-5 mr-0 sm:mr-2" />
          <span class="hidden sm:inline">Novo Cliente</span>
        </BaseButton>
        
      </div>

      <template #filters>
        <BaseFilters :active-filters-count="activeFiltersCount" @clear="clearFilters" data-tour="clientes-busca">
          <template #search>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por nome, e-mail ou documento..." 
              class="w-full h-[52px] pl-12 pr-5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-xs"
            >
            <div class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
              <Search class="w-5 h-5" />
            </div>
          </template>
        </BaseFilters>
      </template>
    </PageHeader>

     <!-- Modal de Info do Cliente -->
    <BaseDialog 
      v-model:open="showInfo" 
      :title="selectedClient?.name || ''" 
      size="xl"
    >
      <div v-if="selectedClient" class="space-y-6 py-2">
        <!-- Header do Cliente: Avatar + Nome + Documento + Botões Rápidos -->
        <div class="text-white py-5 rounded-[12px] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-[12px] bg-blue-600 dark:bg-blue-700 flex items-center justify-center text-white text-xl font-black shrink-0">
              {{ selectedClient.name?.substring(0, 2).toUpperCase() }}
            </div>
            <div>
              <h2 class="text-xl font-black tracking-tight text-white">{{ selectedClient.name }}</h2>
              <div class="flex items-center gap-3 mt-1 text-xs text-slate-300 font-medium">
                <span v-if="selectedClient.taxId" class="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  {{ selectedClient.taxId }}
                </span>
                <span v-else class="text-slate-400 italic text-[11px]">Sem documento informado</span>
              </div>
            </div>
          </div>

          <!-- Ações Rápidas -->
          <div class="flex items-center gap-2 w-full md:w-auto shrink-0">
            <a 
              v-if="selectedClient.email" 
              :href="`mailto:${selectedClient.email}`"
              class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700"
            >
              <Mail class="w-4 h-4 text-blue-400" />
              E-mail
            </a>
            <a 
              v-if="selectedClient.phone" 
              :href="selectedClient.isWhatsapp ? `https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}` : `tel:${selectedClient.phone}`"
              target="_blank"
              class="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[12px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
            >
              <img v-if="selectedClient.isWhatsapp" src="/images/icons/whatsapp-svg.svg" class="w-4 h-4" alt="WhatsApp" />
              <Phone v-else class="w-4 h-4" />
              {{ selectedClient.isWhatsapp ? 'WhatsApp' : 'Ligar' }}
            </a>
          </div>
        </div>

        <!-- Cards de Métricas Comerciais -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <!-- Total Orçamentos -->
          <div class="p-5 rounded-[12px] bg-gray-50 dark:bg-gray-900/60 border-2 border-gray-100 dark:border-gray-800 space-y-1">
            <div class="flex items-center justify-between text-gray-400 dark:text-gray-500">
              <span class="text-[10px] font-black uppercase tracking-wider">Total Orçamentos</span>
              <FileText class="w-4 h-4 text-blue-500" />
            </div>
            <div v-if="loadingStats" class="h-7 bg-gray-200 dark:bg-gray-800 rounded animate-pulse w-12" />
            <p v-else class="text-2xl font-black text-gray-900 dark:text-gray-100">
              {{ clientStats?.stats?.totalProposals || 0 }}
            </p>
            <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Histórico cadastrado</p>
          </div>

          <!-- Fechados / Aprovados -->
          <div class="p-5 rounded-[12px] bg-emerald-50/60 dark:bg-emerald-950/30 border-2 border-emerald-100 dark:border-emerald-900/50 space-y-1">
            <div class="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span class="text-[10px] font-black uppercase tracking-wider">Fechados</span>
              <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div v-if="loadingStats" class="h-7 bg-emerald-200/50 dark:bg-emerald-900/40 rounded animate-pulse w-24" />
            <p v-else class="text-xl font-black text-emerald-700 dark:text-emerald-300">
              {{ formatCurrency(clientStats?.stats?.acceptedTotalValue) }}
            </p>
            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              {{ clientStats?.stats?.acceptedCount || 0 }} {{ (clientStats?.stats?.acceptedCount === 1) ? 'orçamento' : 'orçamentos' }}
            </p>
          </div>

          <!-- Em Aberto -->
          <div class="p-5 rounded-[12px] bg-amber-50/60 dark:bg-amber-950/30 border-2 border-amber-100 dark:border-amber-900/50 space-y-1">
            <div class="flex items-center justify-between text-amber-600 dark:text-amber-400">
              <span class="text-[10px] font-black uppercase tracking-wider">Em Aberto</span>
              <Clock class="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div v-if="loadingStats" class="h-7 bg-amber-200/50 dark:bg-amber-900/40 rounded animate-pulse w-24" />
            <p v-else class="text-xl font-black text-amber-700 dark:text-amber-300">
              {{ formatCurrency(clientStats?.stats?.pendingTotalValue) }}
            </p>
            <p class="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
              {{ clientStats?.stats?.pendingCount || 0 }} {{ (clientStats?.stats?.pendingCount === 1) ? 'aguardando' : 'aguardando' }}
            </p>
          </div>

          <!-- Recusados / Expirados -->
          <div class="p-5 rounded-[12px] bg-rose-50/60 dark:bg-rose-950/30 border-2 border-rose-100 dark:border-rose-900/50 space-y-1">
            <div class="flex items-center justify-between text-rose-600 dark:text-rose-400">
              <span class="text-[10px] font-black uppercase tracking-wider">Recusados</span>
              <XCircle class="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div v-if="loadingStats" class="h-7 bg-rose-200/50 dark:bg-rose-900/40 rounded animate-pulse w-24" />
            <p v-else class="text-xl font-black text-rose-700 dark:text-rose-300">
              {{ formatCurrency(clientStats?.stats?.expiredTotalValue) }}
            </p>
            <p class="text-[11px] text-rose-600 dark:text-rose-400 font-bold">
              {{ clientStats?.stats?.expiredCount || 0 }} {{ (clientStats?.stats?.expiredCount === 1) ? 'recusado' : 'recusados' }}
            </p>
          </div>
        </div>

        <!-- Indicadores Comerciais Adicionais (Taxa de Conversão & Ticket Médio) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 rounded-[12px] bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-[12px] bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <TrendingUp class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-bold">Taxa de Conversão</p>
                <p class="text-lg font-black text-gray-900 dark:text-gray-100">
                  {{ clientStats?.stats?.conversionRate || 0 }}% das propostas fechadas
                </p>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-[12px] bg-gray-50/60 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="p-2.5 rounded-[12px] bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <DollarSign class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 font-bold">Ticket Médio Fechado</p>
                <p class="text-lg font-black text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(clientStats?.stats?.avgTicket) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detalhes do Cadastro (E-mail, Telefone, Endereço, Observações) -->
        <div class="space-y-4">
          <h3 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Dados Cadastrais</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-[12px] border border-gray-100 dark:border-gray-800">
              <Mail class="w-5 h-5 text-gray-400 shrink-0" />
              <div class="min-w-0">
                <p class="text-[10px] font-bold text-gray-400 uppercase">E-mail</p>
                <p class="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{{ selectedClient.email || 'Não informado' }}</p>
              </div>
            </div>

            <div class="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-[12px] border border-gray-100 dark:border-gray-800">
              <Phone class="w-5 h-5 text-gray-400 shrink-0" />
              <div class="min-w-0">
                <p class="text-[10px] font-bold text-gray-400 uppercase">Telefone / Celular</p>
                <p class="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {{ selectedClient.phone ? formatPhone(selectedClient.phone) : 'Não informado' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Endereço -->
          <div v-if="formattedAddress" class="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-[12px] border border-gray-100 dark:border-gray-800">
            <MapPin class="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p class="text-[10px] font-bold text-gray-400 uppercase">Endereço de Cobrança</p>
              <p class="text-xs font-bold text-gray-800 dark:text-gray-200">{{ formattedAddress }}</p>
            </div>
          </div>

          <!-- Notas Internas -->
          <div v-if="selectedClient.notes" class="p-4 bg-white dark:bg-gray-900 rounded-[12px] border border-gray-100 dark:border-gray-800 space-y-1">
            <p class="text-[10px] font-bold text-gray-400 uppercase">Notas Internas</p>
            <p class="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ selectedClient.notes }}</p>
          </div>
        </div>

        <!-- Tabela de Orçamentos Recentes -->
        <div class="space-y-3">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Últimos Orçamentos do Cliente</h3>
          </div>

          <div v-if="loadingStats" class="space-y-2">
            <BaseSkeleton v-for="i in 3" :key="i" height="3rem" borderRadius="12px" />
          </div>

          <div v-else-if="!clientStats?.recentProposals || clientStats.recentProposals.length === 0" class="p-6 text-center bg-gray-50 dark:bg-gray-900/40 rounded-[12px] border border-gray-100 dark:border-gray-800 ">
            <p class="text-xs font-bold text-gray-500">Nenhum orçamento emitido para este cliente ainda.</p>
          </div>

          <div v-else class="space-y-2">
            <div 
              v-for="p in clientStats.recentProposals" 
              :key="p._id"
              class="flex items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-[12px] border border-gray-100 dark:border-gray-800 hover:border-blue-500/30 transition-all h-max-[200px] overflow-auto"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-[12px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-xs">
                  #{{ p.sequenceNumber || p.code }}
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-900 dark:text-gray-100 truncate max-w-[200px] md:max-w-[300px]">{{ p.title }}</p>
                  <p class="text-[10px] text-gray-400 font-medium">{{ new Date(p.createdAt).toLocaleDateString('pt-BR') }}</p>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span 
                  :class="getStatusBadge(p.status).color"
                  class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border"
                >
                  {{ getStatusBadge(p.status).label }}
                </span>
                <span class="text-xs font-black text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(p.total) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end px-1">

            <NuxtLink 
              v-if="selectedClient.email || selectedClient.name" 
              :to="`/orcamentos?search=${encodeURIComponent(selectedClient.email || selectedClient.name)}`" 
              class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              Ver todos os orçamentos
              <ExternalLink class="w-3 h-3" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end w-full gap-1">
          <BaseButton type="button" variant="danger" class="w-full" @click="showInfo = false; openModal(selectedClient)">
            <Trash2 class="w-4 h-4 mr-2" />
            Excluír
          </BaseButton>
          <BaseButton type="button"class="w-full" @click="showInfo = false; openModal(selectedClient)">
            <Pencil class="w-4 h-4 mr-2" />
            Editar
          </BaseButton>
        </div>
      </template>
    </BaseDialog>

    <!-- Modal de Formulário -->
    <BaseDialog 
      v-model:open="showForm" 
      :title="selectedClient ? 'Editar Cliente' : 'Novo Cliente'" 
      size="lg"
    >
      <form id="client-form" @submit.prevent="saveClient" class="space-y-8 py-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput 
            v-model="form.name" 
            label="Nome Completo / Razão Social" 
            placeholder="Ex: João Silva" 
            required 
          />
          <BaseInput 
            v-model="form.taxId" 
            label="CPF / CNPJ" 
            placeholder="000.000.000-00" 
            mask="document"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput 
            v-model="form.email"
            type="email"
            label="E-mail"
            placeholder="cliente@email.com"
            required 
          />
          <div class="space-y-3">
            <BaseInput
              v-model="form.phone"
              label="Telefone / Celular"
              placeholder="(00) 00000-0000"
              mask="phone"
            />
            <div class="flex items-center gap-3 ml-2">
              <BaseCheckbox v-model="form.isWhatsapp" id="isWhatsapp" />
              <label for="isWhatsapp" class="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                Este número possui WhatsApp
              </label>
            </div>
          </div>
        </div>

        <div class="bg-gray-50/50 dark:bg-gray-900/60 p-6 rounded-[12px] border border-gray-100 dark:border-gray-800 space-y-6">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] font-black text-gray-400 dark:text-gray-400 uppercase tracking-[0.2em]">Endereço de Cobrança</h3>
            <div v-if="isSearchingZip" class="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 animate-pulse uppercase tracking-widest">
              <RefreshCcw class="w-3 h-3 animate-spin" />
              Buscando...
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseInput 
              v-model="form.address.zip"
              label="CEP (opcional)"
              placeholder="00000-000"
              mask="cep"
              @update:model-value="searchZip"
            />
            <div class="md:col-span-2">
              <BaseInput
                v-model="form.address.street"
                label="Logradouro"
                placeholder="Rua, Avenida..."
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseInput 
              v-model="form.address.number" 
              label="Número / Comp." 
              placeholder="123, Bloco A..." 
            />
            <div class="md:col-span-2">
              <BaseInput 
                v-model="form.address.neighborhood"
                label="Bairro"
                placeholder="Ex: Centro"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput 
              v-model="form.address.city"
              label="Cidade"
              placeholder="Ex: São Paulo"
            />
             <BaseSelect
              v-model="form.address.state"
              placeholder="Ex: SP"
              label="Estado"
              :options="[
                { label: 'Selecione o Estado', value: '__EMPTY__' },
                ...Object.entries(stateMap).map(([value, info]: any) => ({
                  label: info.label,
                  value: value.toUpperCase()
                }))
              ]"
            />
          </div>
        </div>

        <BaseTextarea 
          v-model="form.notes" 
          label="Notas Internas (opcional)"
          :rows="3" 
          placeholder="Alguma observação sobre este cliente..."
        />

      </form>

      <template #footer>
        <BaseButton
          variant="secondary"
          size="md"
          @click="showForm = false"
          :disabled="isSubmitting"
        >
          Cancelar
        </BaseButton>
        <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="saveClient">
          {{ selectedClient ? 'Salvar' : 'Cadastrar' }}
        </BaseButton>
      </template>
    </BaseDialog>

    <!-- Listagem Unificada (desktop & mobile) -->
    <BaseDataList
      :columns="[
        { key: 'name', label: 'Cliente' },
        { key: 'contact', label: 'Contato' },
        { key: 'location', label: 'Localização' },
        // { key: 'actions', label: '', align: 'right' }
      ]"
      :items="clients || []"
      :pending="pending"
      :has-more="hasMore"
      :loading-more="loadingMore"
      @load-more="loadMore"
      empty-title="Sem Clientes"
      empty-subtitle="Sua lista de clientes aparecerá aqui. Comece cadastrando o primeiro."
    >
      <template #cell-name="{ item: client }">
        <div class="flex flex-col cursor-pointer" @click="openInfoModal(client)">
          <span class="font-black text-base md:text-lg text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            {{ client.name }}
          </span>
          <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
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
            <span class="text-xs font-black text-gray-400 dark:text-gray-500">
              {{ formatPhone(client.phone) }}
            </span>
            <img v-if="client.isWhatsapp" :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5" alt="WhatsApp" loading="lazy" />
          </div>
        </div>
      </template>

      <template #cell-location="{ item: client }">
        <div class="flex flex-col cursor-pointer" @click="openInfoModal(client)">
          <span class="text-[10px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">
            {{ client.address?.city || '-' }} - {{ client.address?.state || '-' }}
          </span>
          <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest line-clamp-1 max-w-[400px] mt-0.5">
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
  </div>
</template>
