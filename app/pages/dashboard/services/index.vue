<script setup lang="ts">
definePageMeta({
  
})

const { data: services, refresh } = useFetch('/api/services')

const showForm = ref(false)
const selectedService = ref<any>(null)
const searchQuery = ref('')

const filteredServices = computed(() => {
  if (!services.value) return []
  if (!searchQuery.value) return services.value
  
  const query = searchQuery.value.toLowerCase()
  return services.value.filter((s: any) => 
    s.name.toLowerCase().includes(query) || 
    s.description?.toLowerCase().includes(query)
  )
})

const form = ref({
  name: '',
  description: '',
  basePrice: 0,
  billingType: 'fixed' as 'fixed' | 'hour'
})

const isSubmitting = ref(false)
const isGenerating = ref(false)

function openModal(service: any = null) {
  if (service) {
    selectedService.value = service
    form.value = { 
      name: service.name, 
      description: service.description, 
      basePrice: service.basePrice, 
      billingType: service.billingType 
    }
  } else {
    selectedService.value = null
    form.value = { name: '', description: '', basePrice: 0, billingType: 'fixed' }
  }
  showForm.value = true
}

async function generateWithAI() {
  if (!form.value.name) return alert('Digite o nome do serviço primeiro')
  isGenerating.value = true
  try {
    const promptTemplate = `Você é um especialista em copywriting corporativo e negociação B2B, ajudando um freelancer a fechar contratos. 
Sua tarefa é transformar um título de serviço e alguns tópicos curtos em uma descrição comercial altamente persuasiva, profissional e clara para ser inserida diretamente em uma proposta de orçamento.

REGRA DE SAÍDA ESTILIZADA:
1. O texto deve ter no máximo 2 parágrafos curtos.
2. Foque no "valor percebido" e nos benefícios para o negócio do cliente, não apenas nas características técnicas.
3. Se os tópicos contiverem vários itens, formate os entregáveis principais em uma 'bullet list' concisa.
4. O tom deve ser confiante, direto e premium.
5. NÃO inclua saudações, conclusões genéricas ou frases como "Aqui está a sua descrição". Retorne EXATAMENTE e APENAS o texto que será impresso no orçamento.
6. Não mencione valores, preços ou prazos de expiração (isso será tratado pelo sistema).
7. A descrição deve ser breve (MAX 280 caracteres).
8. O serviço é feito por apenas uma pessoa, por tanto não trate como equipe.

DADOS DO SERVIÇO:
- Nome do Serviço: ${form.value.name}
- Tópicos/Detalhes informados pelo freelancer: ${form.value.description || 'Não informado'}

Escreva a descrição comercial agora:`

    const { text } = await $fetch('/api/ai/generate', {
      method: 'POST',
      body: { prompt: promptTemplate }
    })
    form.value.description = text
  } catch (e) {
    alert('Erro ao gerar descrição')
  } finally {
    isGenerating.value = false
  }
}

async function saveService() {
  isSubmitting.value = true
  try {
    const method = selectedService.value ? 'PUT' : 'POST'
    const endpoint = selectedService.value ? `/api/services/${selectedService.value._id}` : '/api/services'
    
    await $fetch(endpoint, {
      method,
      body: form.value
    })
    showForm.value = false
    refresh()
  } catch (e) {
    alert('Erro ao salvar serviço')
  } finally {
    isSubmitting.value = false
  }
}

async function deleteService(id: string) {
  if (!confirm('Tem certeza?')) return
  try {
    await $fetch(`/api/services/${id}`, { method: 'DELETE' })
    refresh()
  } catch (e) {
    alert('Erro ao excluir')
  }
}
</script>

<template>
  <div>
    <header class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Seu Catálogo</h1>
        <p class="text-gray-600">Gerencie os serviços que você oferece.</p>
      </div>
      <button 
        @click="openModal()"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        Novo Serviço
      </button>
    </header>

    <!-- Filtros -->
    <div class="mb-6 relative max-w-md">
      <input 
        v-model="searchQuery"
        type="text" 
        placeholder="Buscar serviços..." 
        class="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
      >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>

    <!-- Modal de Formulário -->
    <AppModal 
      :show="showForm" 
      :title="selectedService ? 'Editar Serviço' : 'Novo Serviço'" 
      @close="showForm = false"
    >
      <form @submit.prevent="saveService" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
          <input v-model="form.name" required type="text" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Desenvolvimento de Landing Page">
        </div>
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block text-sm font-medium text-gray-700">Descrição (opcional)</label>
            <button 
              type="button"
              @click="generateWithAI"
              :disabled="isGenerating"
              class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {{ isGenerating ? 'Gerando...' : 'Gerar com IA' }}
            </button>
          </div>
          <textarea v-model="form.description" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
            <input v-model.number="form.basePrice" required type="number" step="0.01" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Cobrança</label>
            <select v-model="form.billingType" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="fixed">Preço Fixo</option>
              <option value="hour">Por Hora</option>
            </select>
          </div>
        </div>
        <div class="flex justify-end pt-4">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            {{ isSubmitting ? 'Salvando...' : 'Salvar Serviço' }}
          </button>
        </div>
      </form>
    </AppModal>

    <!-- Listagem -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-gray-50/50 border-b border-gray-100">
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Serviço</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Preço</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Tipo</th>
            <th class="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ações</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="service in filteredServices" :key="service._id" class="hover:bg-gray-50/50 transition-colors group">
            <td class="px-6 py-4">
              <div class="flex flex-col">
                <span class="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{{ service.name }}</span>
                <span class="text-xs text-gray-500 line-clamp-1 max-w-md">{{ service.description || 'Sem descrição' }}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right">
              <span class="font-black text-gray-900">R$ {{ service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
            </td>
            <td class="px-6 py-4 text-center">
              <span :class="service.billingType === 'fixed' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'" class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                {{ service.billingType === 'fixed' ? 'Fixo' : 'Hora' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-1">
                <button @click="openModal(service)" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="deleteService(service._id)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Excluir">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="filteredServices?.length === 0" class="text-center py-20">
        <div class="w-16 h-16 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 class="font-bold text-gray-900">{{ searchQuery ? 'Nenhum resultado' : 'Catálogo Vazio' }}</h3>
        <p class="text-gray-500 text-sm mt-1">{{ searchQuery ? 'Tente outros termos de busca.' : 'Adicione serviços para agilizar suas propostas.' }}</p>
        <button v-if="!searchQuery" @click="openModal()" class="mt-6 text-blue-600 font-bold hover:underline">Cadastrar Primeiro Serviço</button>
        <button v-else @click="searchQuery = ''" class="mt-6 text-blue-600 font-bold hover:underline">Limpar Busca</button>
      </div>
    </div>
  </div>
</template>
