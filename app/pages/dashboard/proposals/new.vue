<script setup lang="ts">
definePageMeta({
  
})

const { data: services } = useFetch('/api/services')

const form = ref({
  title: '',
  client: {
    name: '',
    email: '',
    phone: ''
  },
  items: [] as any[]
})

const isSubmitting = ref(false)

function toggleService(service: any) {
  const index = form.value.items.findIndex(i => i.serviceId === service._id)
  if (index > -1) {
    form.value.items.splice(index, 1)
  } else {
    form.value.items.push({
      serviceId: service._id,
      name: service.name,
      description: service.description,
      price: service.basePrice,
      quantity: 1
    })
  }
}

const totalPreview = computed(() => {
  return form.value.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
})

async function createProposal() {
  if (form.value.items.length === 0) return alert('Selecione pelo menos um serviço')
  
  isSubmitting.value = true
  try {
    await $fetch('/api/proposals', {
      method: 'POST',
      body: {
        ...form.value,
        status: 'pending'
      }
    })
    navigateTo('/dashboard/proposals')
  } catch (e) {
    alert('Erro ao criar proposta')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <header class="mb-8">
      <NuxtLink to="/dashboard/proposals" class="text-blue-600 text-sm font-medium hover:underline mb-2 block">← Voltar</NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900">Nova Proposta</h1>
      <p class="text-gray-600">Preencha os dados abaixo para gerar o orçamento.</p>
    </header>

    <form @submit.prevent="createProposal" class="space-y-8">
      <!-- Info Básica -->
      <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 class="text-lg font-semibold mb-4">Informações do Projeto</h2>
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Título da Proposta (Interno)</label>
            <input v-model="form.title" required type="text" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Landing Page - Cliente X">
          </div>
        </div>
      </section>

      <!-- Cliente -->
      <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 class="text-lg font-semibold mb-4">Dados do Cliente</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome do Cliente</label>
            <input v-model="form.client.name" required type="text" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail do Cliente</label>
            <input v-model="form.client.email" required type="email" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
      </section>

      <!-- Serviços -->
      <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Selecione os Serviços</h2>
          <NuxtLink to="/dashboard/services" class="text-sm text-blue-600 hover:underline">+ Editar Catálogo</NuxtLink>
        </div>
        <div class="grid grid-cols-1 gap-3">
          <div v-for="service in services" :key="service._id" 
            @click="toggleService(service)"
            :class="{
              'p-4 border-2 rounded-xl cursor-pointer transition flex justify-between items-center': true,
              'border-blue-500 bg-blue-50': form.items.some(i => i.serviceId === service._id),
              'border-gray-100 hover:border-gray-200': !form.items.some(i => i.serviceId === service._id)
            }"
          >
            <div>
              <p class="font-bold text-gray-900">{{ service.name }}</p>
              <p class="text-sm text-gray-500">{{ service.description }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-blue-600">R$ {{ service.basePrice }}</p>
              <p class="text-xs text-gray-500">{{ service.billingType === 'fixed' ? 'Fixo' : 'p/ hora' }}</p>
            </div>
          </div>
          <div v-if="services?.length === 0" class="text-center py-8 border-2 border-dashed rounded-xl">
            <p class="text-gray-500 mb-2">Seu catálogo está vazio.</p>
            <NuxtLink to="/dashboard/services" class="text-blue-600 font-medium">Cadastrar primeiro serviço</NuxtLink>
          </div>
        </div>
      </section>

      <!-- Totais -->
      <div class="sticky bottom-8 bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex justify-between items-center">
        <div>
          <p class="text-sm text-gray-500">Total da Proposta</p>
          <p class="text-2xl font-bold text-gray-900">R$ {{ totalPreview.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</p>
        </div>
        <button 
          type="submit"
          :disabled="isSubmitting || form.items.length === 0"
          class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {{ isSubmitting ? 'Gerando...' : 'Gerar Proposta' }}
        </button>
      </div>
    </form>
  </div>
</template>
