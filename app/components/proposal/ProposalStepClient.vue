<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  form: any
  clients: any[]
  selectedClientId: string
  clientSearch?: string
  pending?: boolean
}>()

const emit = defineEmits(['update:selectedClientId', 'update:clientSearch'])

const clientOptions = computed(() => {
  return props.clients.map((c: any) => ({
    label: c.name,
    value: c._id
  })) || []
})

const internalSelectedClient = computed({
  get: () => props.selectedClientId,
  set: (val) => emit('update:selectedClientId', val)
})

const internalSearch = computed({
  get: () => props.clientSearch,
  set: (val) => emit('update:clientSearch', val)
})

function onClientSelect(clientId: string | undefined) {
  internalSelectedClient.value = clientId || ''
  if (!clientId) return
  const client = props.clients.find((c: any) => c._id === clientId)
  if (client) {
    props.form.client.name = client.name
    props.form.client.email = client.email
    
    props.form.client.phone = client.phone || ''
  }
}
</script>

<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="space-y-2">
      <h3 class="text-lg font-black text-gray-900 tracking-tight">Detalhes do Orçamento</h3>
      <p class="text-sm text-gray-500 font-medium">Comece dando um nome ao seu projeto e identificando o cliente.</p>
    </div>

    <div class="space-y-6">

      
      <div class="space-y-4 pt-4 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Dados do Cliente</label>
        </div>
        
        <BaseCombobox 
          v-model="internalSelectedClient" 
          v-model:search="internalSearch"
          label="Buscar Cliente Cadastrado" 
          :options="clientOptions"
          :loading="pending"
          placeholder="Selecione ou busque..."
          @update:model-value="onClientSelect"
        />
        
        <div class="p-6 bg-gray-50 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <BaseInput v-model="form.client.name" label="Nome do Cliente" readonly disabled class="bg-gray-100/50" required />
          </div>
          <BaseInput v-model="form.client.email" label="E-mail" readonly disabled class="bg-gray-100/50" required />
          <BaseInput v-model="form.client.phone" label="WhatsApp" readonly disabled class="bg-gray-100/50" />
        </div>
      </div>
    </div>
  </div>
</template>
