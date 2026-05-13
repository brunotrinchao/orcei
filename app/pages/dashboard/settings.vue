<script setup lang="ts">
const { data: profile, refresh } = await useFetch('/api/profile')

const isSaving = ref(false)

async function updateProfile() {
  isSaving.value = true
  try {
    // Note: Supondo que a API de profile aceite PUT para atualizar brandConfig e templates
    await $fetch('/api/profile', {
      method: 'PUT',
      body: {
        name: profile.value.name,
        brandConfig: profile.value.brandConfig,
        defaultContractTemplate: profile.value.defaultContractTemplate,
        defaultTermsAndConditions: profile.value.defaultTermsAndConditions
      }
    })
    alert('Configurações salvas!')
    refresh()
  } catch (e) {
    alert('Erro ao salvar configurações')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <header class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Configurações</h1>
      <p class="text-gray-600">Personalize sua marca e modelos padrão.</p>
    </header>

    <div v-if="profile" class="space-y-8">
      <!-- Identidade -->
      <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 class="text-lg font-semibold mb-4">Sua Marca</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nome Profissional / Empresa</label>
            <input v-model="profile.name" type="text" class="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cor Primária</label>
            <div class="flex gap-2">
              <input v-model="profile.brandConfig.primaryColor" type="color" class="h-10 w-20 border rounded-lg p-1">
              <input v-model="profile.brandConfig.primaryColor" type="text" class="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase">
            </div>
          </div>
        </div>
      </section>

      <!-- Templates Padrão -->
      <section class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 class="text-lg font-semibold mb-4">Modelos Padrão</h2>
        <p class="text-sm text-gray-500 mb-6">Estes textos serão usados automaticamente em todas as novas propostas.</p>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Contrato Padrão</label>
            <RichTextEditor v-model="profile.defaultContractTemplate" />
          </div>
          <div>
            <label class="block text-sm font-bold text-gray-700 mb-2">Termos e Condições Padrão</label>
            <RichTextEditor v-model="profile.defaultTermsAndConditions" />
          </div>
        </div>
      </section>

      <div class="flex justify-end">
        <button 
          @click="updateProfile"
          :disabled="isSaving"
          class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {{ isSaving ? 'Salvando...' : 'Salvar Configurações' }}
        </button>
      </div>
    </div>
  </div>
</template>
