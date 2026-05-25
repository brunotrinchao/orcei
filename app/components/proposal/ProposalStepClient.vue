<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  form: any
  clients: any[]
  selectedClientId: string
}>()

const emit = defineEmits(['update:selectedClientId'])

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

function onClientSelect(clientId: string | undefined) {
  internalSelectedClient.value = clientId || ''
  if (!clientId) return
  const client = props.clients.find((c: any) => c._id === clientId)
  if (client) {
    props.form.client.name = client.name
    props.form.client.email = client.email
    
    // Reset phone first to trigger reactivity properly in masked inputs
    props.form.client.phone = ''
    setTimeout(() => {
      props.form.client.phone = client.phone || ''
    }, 0)
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
      <BaseInput 
        v-model="form.title" 
        label="Título do Orçamento" 
        placeholder="Ex: Site Institucional - Empresa X" 
        required 
      />
      
      <div class="space-y-4 pt-4 border-t border-gray-100">
        <div class="flex items-center justify-between">
          <label class="block text-xs font-black text-gray-600 uppercase tracking-widest ml-1">Dados do Cliente</label>
        </div>
        
        <BaseSelect 
          v-model="internalSelectedClient" 
          label="Buscar Cliente Cadastrado (Opcional)" 
          :options="clientOptions"
          @update:model-value="onClientSelect"
        />
        
        <div class="p-6 bg-gray-50 rounded-3xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <BaseInput v-model="form.client.name" label="Nome do Cliente" required />
          </div>
          <BaseInput v-model="form.client.email" label="E-mail" required />
          <BaseInput v-model="form.client.phone" label="WhatsApp (Opcional)" mask="phone" />
        </div>
      </div>
    </div>
  </div>
</template>
