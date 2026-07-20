<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus, Pencil, Trash2, RefreshCcw, MapPin, Mail, Phone, ExternalLink, MoreVertical } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { ClientDTO } from '../../../../types'

const { notify, confirm: confirmAlert } = useAlerts()

const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const { data: clientsData, refresh, pending } = useLazyFetch<any>('/api/clients', {
  query: computed(() => ({
    page: currentPage.value,
    limit: itemsPerPage,
    search: searchQuery.value
  })),
  watch: [currentPage, searchQuery]
})

const clients = computed(() => clientsData.value?.items || [])
const totalClients = computed(() => clientsData.value?.total || 0)

const showForm = ref(false)
const selectedClient = ref<ClientDTO | null>(null)

const form = ref({
  name: '',
  taxId: '',
  email: '',
  phone: '',
  isWhatsapp: true,
  address: {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip: ''
  },
  notes: ''
})

const isSubmitting = ref(false)
const isSearchingZip = ref(false)

function openModal(client: ClientDTO | null = null) {
  if (client) {
    selectedClient.value = client
    // Normalize all fields: undefined → '' to avoid prop type errors on BaseInput
    form.value = {
      name: client.name ?? '',
      taxId: client.taxId ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      isWhatsapp: client.isWhatsapp ?? true,
      address: {
        street: client.address?.street ?? '',
        number: client.address?.number ?? '',
        neighborhood: client.address?.neighborhood ?? '',
        city: client.address?.city ?? '',
        state: client.address?.state ?? '',
        zip: client.address?.zip ?? ''
      },
      notes: client.notes ?? ''
    }
  } else {
    selectedClient.value = null
    form.value = {
      name: '',
      taxId: '',
      email: '',
      phone: '',
      isWhatsapp: true,
      address: {
        street: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zip: ''
      },
      notes: ''
    }
  }
  showForm.value = true
}

async function searchZip() {
  const zip = form.value.address.zip.replace(/\D/g, '')
  if (zip.length !== 8) return

  isSearchingZip.value = true
  try {
    const data: any = await $fetch(`https://viacep.com.br/ws/${zip}/json/`)
    if (!data.erro) {
      form.value.address.street = data.logradouro
      form.value.address.neighborhood = data.bairro
      form.value.address.city = data.localidade
      form.value.address.state = data.uf
    }
  } catch (e) {
    console.error('Erro ao buscar CEP', e)
  } finally {
    isSearchingZip.value = false
  }
}

async function saveClient() {
  isSubmitting.value = true
  try {
    const method = selectedClient.value ? 'PUT' : 'POST'
    const endpoint = selectedClient.value ? `/api/clients/${selectedClient.value._id}` : '/api/clients'
    
    await $fetch(endpoint, {
      method,
      body: form.value
    })
    showForm.value = false
    refresh()
  } catch (e: any) {
    const html = parseApiErrors(e)
    notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Erro ao salvar cliente'))
  } finally {
    isSubmitting.value = false
  }
}

async function deleteClient(id: string) {
  confirmAlert({
    title: 'Excluir Cliente',
    description: 'Tem certeza que deseja excluir este cliente?',
    variant: 'destructive',
    onConfirm: async () => {
      try {
        await $fetch(`/api/clients/${id}`, { method: 'DELETE' })
        refresh()
      } catch (e) {
        notify('Erro', 'Erro ao excluir cliente')
      }
    }
  })
}

// Formatters
const formatPhone = (phone: string) => {
  const r = phone.replace(/\D/g, '')
  if (r.length === 11) {
    return `(${r.substring(0, 2)}) ${r.substring(2, 7)}-${r.substring(7)}`
  }
  if (r.length === 10) {
    return `(${r.substring(0, 2)}) ${r.substring(2, 6)}-${r.substring(6)}`
  }
  return phone
}
</script>

<template>
  <div class="space-y-10 relative">
    <PageHeader title="Seus Clientes" subtitle="Gerencie seus contatos e acelere seus orçamentos.">
      <BaseButton data-tour="clientes-novo-btn" @click="openModal()" class="w-full sm:w-auto shadow-2xl shadow-blue-100">
        Cadastrar Novo Cliente
      </BaseButton>
    </PageHeader>

    <!-- Filtros -->
    <div data-tour="clientes-busca" class="mb-10 relative max-w-xl">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por nome, e-mail ou documento..." 
        class="w-full pl-14 pr-6 py-5 bg-white border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-sm"
      >
      <div class="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
        <Search class="w-6 h-6" />
      </div>
    </div>

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
              required 
            />
            <div class="flex items-center gap-3 ml-2">
              <BaseCheckbox v-model="form.isWhatsapp" id="isWhatsapp" />
              <label for="isWhatsapp" class="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors">
                Este número possui WhatsApp
              </label>
            </div>
          </div>
        </div>

        <div class="bg-gray-50/50 p-8 rounded-[2.5rem] border-2 border-gray-100 space-y-6">
          <div class="flex items-center justify-between px-1">
            <h3 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Endereço de Cobrança</h3>
            <div v-if="isSearchingZip" class="flex items-center gap-2 text-[10px] font-black text-blue-600 animate-pulse uppercase tracking-widest">
              <RefreshCcw class="w-3 h-3 animate-spin" />
              Buscando...
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BaseInput 
              v-model="form.address.zip" 
              label="CEP" 
              placeholder="00000-000" 
              mask="cep"
              @update:model-value="searchZip"
              required
            />
            <div class="md:col-span-2">
              <BaseInput 
                v-model="form.address.street" 
                label="Logradouro" 
                placeholder="Rua, Avenida..." 
                required 
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
                required 
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput 
              v-model="form.address.city" 
              label="Cidade" 
              placeholder="Ex: São Paulo" 
              required 
            />
            <BaseInput 
              v-model="form.address.state" 
              label="Estado" 
              placeholder="Ex: SP" 
              required 
            />
          </div>
        </div>

        <div class="space-y-3">
          <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-2">Notas Internas (opcional)</label>
          <textarea 
            v-model="form.notes" 
            rows="3" 
            class="w-full px-6 py-5 bg-white border-2 border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-inner"
            placeholder="Alguma observação sobre este cliente..."
          ></textarea>
        </div>

      </form>

      <template #footer>
        <BaseButton type="button" :disabled="isSubmitting" :loading="isSubmitting" @click="saveClient">
          {{ selectedClient ? 'Atualizar Dados' : 'Cadastrar Cliente' }}
        </BaseButton>
      </template>
    </BaseDialog>

    <!-- Listagem Unificada (desktop) -->
    <div class="hidden md:block">
    <BaseDataList
      :items="clients"
      :pending="pending"
      :total="totalClients"
      :items-per-page="itemsPerPage"
      v-model:current-page="currentPage"
      empty-title="Sem Clientes"
      empty-subtitle="Sua lista de clientes aparecerá aqui. Comece cadastrando o primeiro."
    >
      <template #header>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Cliente</th>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Contato</th>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Localização</th>
        <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-right"></th>
      </template>

      <template #item="{ item: client }">
        <tr class="hover:bg-gray-50/30 transition-all group">
          <td class="px-10 py-8">
            <div class="flex flex-col">
              <span class="font-black text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{{ client.name }}</span>
              <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{{ client.taxId || 'Sem documento' }}</span>
            </div>
          </td>
          <td class="px-10 py-8">
            <div class="flex flex-col">
              <span class="text-sm font-bold text-gray-600">{{ client.email }}</span>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs font-black text-gray-400">{{ formatPhone(client.phone) }}</span>
                <img v-if="client.isWhatsapp" :src="'/images/icons/whatsapp-svg.svg'" class="w-3.5 h-3.5" alt="WhatsApp" loading="lazy"/>
              </div>
            </div>
          </td>
          <td class="px-10 py-8">
            <div class="flex flex-col">
              <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">{{ client.address?.city || '-' }} - {{ client.address?.state || '-' }}</span>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1 max-w-[400px] mt-1">{{ client.address?.street }}, {{ client.address?.number }}</span>
            </div>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="flex justify-end gap-3 items-center">
              <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    class="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-2xl transition-all"
                    title="Mais ações"
                    aria-label="Mais ações do orçamento"
                  >
                    <MoreVertical class="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    align="end"
                    :side-offset="6"
                    class="min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
                  >
                  <DropdownMenuItem
                      @click="openModal(client)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
                    >
                      <Pencil class="w-4 h-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      @click="deleteClient(client._id)"
                      class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-red-600 cursor-pointer outline-none transition-all"
                    >
                      <Trash2 class="w-4 h-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
            </div>
          </td>
        </tr>
      </template>

      <!-- Custom skeleton -->
      <template #skeleton>
        <tr v-for="i in 5" :key="i">
          <td class="px-10 py-8">
            <div class="space-y-2">
              <BaseSkeleton width="60%" height="1.25rem" />
              <BaseSkeleton width="30%" height="0.75rem" />
            </div>
          </td>
          <td class="px-10 py-8">
            <div class="space-y-2">
              <BaseSkeleton width="150px" height="0.9rem" />
              <BaseSkeleton width="120px" height="0.9rem" />
            </div>
          </td>
          <td class="px-10 py-8">
            <div class="space-y-2">
              <BaseSkeleton width="100px" height="0.8rem" />
              <BaseSkeleton width="140px" height="0.8rem" />
            </div>
          </td>
          <td class="px-10 py-8 text-right">
            <div class="flex justify-end gap-3">
              <BaseSkeleton width="2.5rem" height="2.5rem" borderRadius="1rem" />
              <BaseSkeleton width="2.5rem" height="2.5rem" borderRadius="1rem" />
            </div>
          </td>
        </tr>
      </template>
    </BaseDataList>
    </div>

    <!-- Listagem em Cards (mobile) -->
    <div class="md:hidden space-y-4">
      <template v-if="pending && clients.length === 0">
        <BaseSkeleton v-for="i in 3" :key="i" height="9rem" borderRadius="1rem" />
      </template>
      <template v-else-if="clients.length === 0">
        <div class="py-16 text-center">
          <p class="font-black text-gray-900">Sem Clientes</p>
          <p class="text-sm text-gray-500 mt-1">Sua lista de clientes aparecerá aqui. Comece cadastrando o primeiro.</p>
        </div>
      </template>
      <template v-else>
        <ClientCard
          v-for="client in clients"
          :key="client._id"
          :client="client"
          :format-phone="formatPhone"
          @edit="openModal(client)"
          @delete="deleteClient(client._id)"
        />
        <div v-if="totalClients > itemsPerPage" class="flex justify-center pt-2">
          <BasePagination :total="totalClients" :items-per-page="itemsPerPage" v-model="currentPage" />
        </div>
      </template>
    </div>
  </div>
</template>
