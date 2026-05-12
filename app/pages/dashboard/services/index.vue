<script setup lang="ts">
definePageMeta({
  
})

const { data: services, refresh } = useFetch('/api/services')

const showForm = ref(false)
const form = ref({
  name: '',
  description: '',
  basePrice: 0,
  billingType: 'fixed' as 'fixed' | 'hour'
})

const isSubmitting = ref(false)

async function saveService() {
  isSubmitting.ref = true
  try {
    await $fetch('/api/services', {
      method: 'POST',
      body: form.value
    })
    form.value = { name: '', description: '', basePrice: 0, billingType: 'fixed' }
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
        @click="showForm = !showForm"
        class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
      >
        {{ showForm ? 'Cancelar' : 'Novo Serviço' }}
      </button>
    </header>

    <!-- Formulário -->
    <div v-if="showForm" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <form @submit.prevent="saveService" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="col-span-full">
          <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
          <input v-model="form.name" required type="text" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Desenvolvimento de Landing Page">
        </div>
        <div class="col-span-full">
          <label class="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
          <textarea v-model="form.description" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" rows="2"></textarea>
        </div>
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
        <div class="col-span-full flex justify-end">
          <button 
            type="submit" 
            :disabled="isSubmitting"
            class="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isSubmitting ? 'Salvando...' : 'Salvar Serviço' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Listagem -->
    <div class="grid grid-cols-1 gap-4">
      <div v-for="service in services" :key="service._id" class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h3 class="font-semibold text-gray-900">{{ service.name }}</h3>
          <p class="text-sm text-gray-500">{{ service.description }}</p>
        </div>
        <div class="flex items-center gap-6">
          <div class="text-right">
            <p class="font-bold text-gray-900">R$ {{ service.basePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
            <p class="text-xs text-gray-500">{{ service.billingType === 'fixed' ? 'Fixo' : 'p/ hora' }}</p>
          </div>
          <button @click="deleteService(service._id)" class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="services?.length === 0 && !showForm" class="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
        <p class="text-gray-500">Você ainda não cadastrou nenhum serviço.</p>
      </div>
    </div>
  </div>
</template>
