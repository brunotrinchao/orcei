<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Plus, Pencil, Trash2, RefreshCcw, MapPin, Mail, Phone, ExternalLink } from 'lucide-vue-next'
import type { ClientDTO } from '../../../../types'

const { notify, confirm: confirmAlert } = useAlerts()
const { data: clients, refresh } = useFetch<ClientDTO[]>('/api/clients')

const showForm = ref(false)
const selectedClient = ref<ClientDTO | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const filteredClients = computed(() => {
  if (!clients.value) return []
  let result = clients.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((c: ClientDTO) => 
      c.name.toLowerCase().includes(query) || 
      c.email.toLowerCase().includes(query) ||
      c.taxId?.includes(query)
    )
  }
  
  return result
})

const paginatedClients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredClients.value.slice(start, end)
})

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
    form.value = JSON.parse(JSON.stringify(client))
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
    notify('Erro', e.data?.message || 'Erro ao salvar cliente')
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
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      <div>
        <h1 class="text-3xl font-black text-gray-900 uppercase tracking-tight">Seus Clientes</h1>
        <p class="text-gray-500 font-medium mt-1">Gerencie seus contatos e acelere seus orçamentos.</p>
      </div>
      <BaseButton @click="openModal()" class="w-full md:w-auto px-10 py-5 rounded-[2rem] shadow-2xl shadow-blue-100">
        Cadastrar Novo Cliente
      </BaseButton>
    </header>

    <!-- Filtros -->
    <div class="mb-10 relative max-w-xl">
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
      <form @submit.prevent="saveClient" class="space-y-8 py-4">
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
              @blur="searchZip"
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

        <div class="flex justify-end pt-6">
          <BaseButton 
            type="submit" 
            :disabled="isSubmitting"
            class="w-full md:w-auto px-12 py-5 rounded-[2rem] shadow-xl shadow-blue-100"
          >
            <RefreshCcw v-if="isSubmitting" class="w-5 h-5 animate-spin mr-3" />
            {{ isSubmitting ? 'Salvando...' : (selectedClient ? 'Atualizar Dados' : 'Cadastrar Cliente') }}
          </BaseButton>
        </div>
      </form>
    </BaseDialog>

    <!-- Listagem -->
    <div class="bg-white rounded-[3rem] border-2 border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden transition-all">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 border-b-2 border-gray-100">
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Cliente</th>
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Contato</th>
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Localização</th>
              <th class="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y-2 divide-gray-50">
            <tr v-for="client in paginatedClients" :key="client._id" class="hover:bg-gray-50/30 transition-all group">
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
                    <div v-if="client.isWhatsapp" class="i-simple-icons-whatsapp w-3.5 h-3.5 text-green-500"></div>
                  </div>
                </div>
              </td>
              <td class="px-10 py-8">
                <div class="flex flex-col">
                  <span class="text-[10px] font-black text-gray-900 uppercase tracking-widest">{{ client.address.city }} - {{ client.address.state }}</span>
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest line-clamp-1 max-w-[180px] mt-1">{{ client.address.street }}, {{ client.address.number }}</span>
                </div>
              </td>
              <td class="px-10 py-8 text-right">
                <div class="flex justify-end gap-3 items-center">
                  <button @click="openModal(client)" class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all" title="Editar">
                    <Pencil class="w-5 h-5" />
                  </button>
                  <button @click="deleteClient(client._id)" class="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all" title="Excluir">
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Paginação -->
      <div v-if="filteredClients.length > itemsPerPage" class="px-10 py-6 border-t-2 border-gray-50 bg-gray-50/20 flex justify-center">
        <BasePagination 
          :total="filteredClients.length" 
          :items-per-page="itemsPerPage" 
          v-model:page="currentPage" 
        />
      </div>
      
      <div v-if="filteredClients?.length === 0" class="text-center py-32 bg-gray-50/20">
        <div class="w-24 h-24 bg-white shadow-xl shadow-gray-100 text-gray-200 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
          <MapPin class="w-10 h-10" />
        </div>
        <h3 class="text-2xl font-black text-gray-900 uppercase tracking-tight">{{ searchQuery ? 'Nada encontrado' : 'Lista Vazia' }}</h3>
        <p class="text-gray-400 font-bold mt-2 px-6 max-w-sm mx-auto">{{ searchQuery ? 'Não encontramos nenhum cliente com esses termos.' : 'Sua lista de clientes aparecerá aqui. Comece cadastrando o primeiro.' }}</p>
        <BaseButton v-if="!searchQuery" @click="openModal()" class="mt-10 px-12 py-5 rounded-[2rem] shadow-xl shadow-blue-100">Cadastrar Primeiro Cliente</BaseButton>
        <button v-else @click="searchQuery = ''" class="mt-10 text-blue-600 font-black uppercase tracking-widest text-xs hover:underline decoration-2 underline-offset-8">Limpar Filtros de Busca</button>
      </div>
    </div>
  </div>
</template>
