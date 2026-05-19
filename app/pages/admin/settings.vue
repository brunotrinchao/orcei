<script setup lang="ts">
import { Settings, ShieldAlert, FileText, Globe, Plus, Trash2, RefreshCcw, Save, ChevronUp, ChevronDown } from 'lucide-vue-next'


const { notify } = useAlerts()
const { user } = useUserSession()
if (process.client && user.value?.role !== 'admin') {
  navigateTo('/dashboard')
}

const { data: settings, refresh } = useFetch<any>('/api/admin/settings')

const localSettings = ref<any>(null)

watch(settings, (val) => {
  if (val) {
    localSettings.value = JSON.parse(JSON.stringify(val))
    if (!localSettings.value.landingPage) {
      localSettings.value.landingPage = { features: [], heroTitle: '', heroSubtitle: '' }
    }
  }
}, { immediate: true })

const isSaving = ref(false)

async function saveSettings() {
  if (!localSettings.value) return
  isSaving.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: localSettings.value
    })
    notify('Sucesso', 'Configurações globais atualizadas!')
    refresh()
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao salvar configurações')
  } finally {
    isSaving.value = false
  }
}

function addFeature() {
  localSettings.value.landingPage.features.push({
    title: 'Nova Funcionalidade',
    description: 'Descrição aqui...',
    icon: 'Sparkles',
    enabled: true
  })
}

function removeFeature(idx: number) {
  localSettings.value.landingPage.features.splice(idx, 1)
}

function moveFeature(idx: number, direction: 'up' | 'down') {
  const features = localSettings.value.landingPage.features
  if (direction === 'up' && idx > 0) {
    const temp = features[idx]
    features[idx] = features[idx - 1]
    features[idx - 1] = temp
  } else if (direction === 'down' && idx < features.length - 1) {
    const temp = features[idx]
    features[idx] = features[idx + 1]
    features[idx + 1] = temp
  }
}

const activeTab = ref<'system' | 'landing'>('system')
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-10">
    <PageHeader title="Configurações da Plataforma" subtitle="Controle o estado do sistema, textos globais e visual da landpage.">
      <template #default>
        <div class="flex items-center gap-6">
          <NuxtLink to="/admin" class="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Voltar ao Painel</NuxtLink>
          <BaseButton @click="saveSettings" :disabled="isSaving" :loading="isSaving" class="shadow-xl shadow-blue-100">
            <Save class="w-4 h-4 mr-2" />
            Salvar Alterações
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <div v-if="localSettings" class="flex flex-col lg:flex-row gap-12 items-start">
      <!-- Tabs Sidebar -->
      <aside class="w-full lg:w-48 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
        <button 
          @click="activeTab = 'system'"
          :class="activeTab === 'system' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'"
          class="flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap lg:whitespace-normal"
        >
          <ShieldAlert class="w-4 h-4" />
          Sistema
        </button>
        <button 
          @click="activeTab = 'landing'"
          :class="activeTab === 'landing' ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'"
          class="flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap lg:whitespace-normal"
        >
          <Globe class="w-4 h-4" />
          Landing Page
        </button>
      </aside>

      <!-- Content -->
      <div class="flex-1 space-y-10 min-w-0">
        <!-- SYSTEM SETTINGS -->
        <div v-if="activeTab === 'system'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section class="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ShieldAlert class="w-5 h-5 text-red-600" />
              </div>
              <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Estado do Sistema</h2>
            </div>

            <div class="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-between gap-6">
              <div class="space-y-1">
                <h3 class="font-black text-gray-900 uppercase text-xs tracking-widest">Modo Manutenção</h3>
                <p class="text-xs text-gray-500 font-medium leading-relaxed">
                  Quando ativado, apenas administradores poderão acessar as rotas de dashboard. Usuários comuns verão uma página de manutenção.
                </p>
              </div>
              <div 
                @click="localSettings.maintenanceMode = !localSettings.maintenanceMode"
                :class="localSettings.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'"
                class="w-16 h-8 rounded-full relative cursor-pointer transition-colors duration-300 shrink-0"
              >
                <div 
                  :class="localSettings.maintenanceMode ? 'translate-x-9' : 'translate-x-1'"
                  class="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BaseInput v-model="localSettings.systemStatus.label" label="Rótulo de Status" placeholder="Ex: Operacional" />
              <BaseSelect 
                v-model="localSettings.systemStatus.color" 
                label="Cor do Status" 
                :options="[{label: 'Verde (Online)', value: 'green'}, {label: 'Amarelo (Instável)', value: 'yellow'}, {label: 'Vermelho (Offline)', value: 'red'}]" 
              />
            </div>
          </section>

          <section class="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <FileText class="w-5 h-5 text-blue-600" />
              </div>
              <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Textos Globais</h2>
            </div>
            <div class="space-y-4">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Texto do Rodapé (Footer)</label>
              <textarea 
                v-model="localSettings.footerText"
                rows="3"
                class="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 placeholder:text-gray-300 shadow-inner resize-none"
              ></textarea>
            </div>
          </section>
        </div>

        <!-- LANDING PAGE SETTINGS -->
        <div v-if="activeTab === 'landing'" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section class="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <Globe class="w-5 h-5 text-purple-600" />
              </div>
              <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Hero Section (Início)</h2>
            </div>
            <div class="space-y-6">
              <BaseInput v-model="localSettings.landingPage.heroTitle" label="Título Principal" />
              <div class="space-y-2">
                <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Subtítulo Hero</label>
                <textarea 
                  v-model="localSettings.landingPage.heroSubtitle"
                  rows="3"
                  class="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-900 shadow-inner resize-none"
                ></textarea>
              </div>
            </div>
          </section>

          <section class="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <RefreshCcw class="w-5 h-5 text-emerald-600" />
                </div>
                <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Funcionalidades</h2>
              </div>
              <BaseButton variant="secondary" size="sm" @click="addFeature">
                <Plus class="w-4 h-4 mr-1" /> Add Recurso
              </BaseButton>
            </div>

            <div class="grid grid-cols-1 gap-6">
              <div v-for="(f, idx) in localSettings.landingPage.features" :key="idx" class="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-4 relative group/feature">
                <div class="flex justify-between items-start gap-4">
                  <!-- Reorder Controls -->
                  <div class="flex items-center gap-2 absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover/feature:opacity-100 transition-all hidden lg:flex flex-col">
                    <button 
                      @click="moveFeature(idx, 'up')" 
                      :disabled="idx === 0"
                      class="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                      title="Mover para cima"
                    >
                      <ChevronUp class="w-4 h-4" />
                    </button>
                    <button 
                      @click="moveFeature(idx, 'down')" 
                      :disabled="idx === localSettings.landingPage.features.length - 1"
                      class="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                      title="Mover para baixo"
                    >
                      <ChevronDown class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BaseInput v-model="f.title" label="Título" />
                    <BaseIconSelect v-model="f.icon" label="Ícone" />
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Mobile Reorder -->
                    <div class="flex lg:hidden items-center gap-1 mr-2">
                      <button @click="moveFeature(idx, 'up')" :disabled="idx === 0" class="p-1.5 text-gray-400 disabled:opacity-30"><ChevronUp class="w-4 h-4" /></button>
                      <button @click="moveFeature(idx, 'down')" :disabled="idx === localSettings.landingPage.features.length - 1" class="p-1.5 text-gray-400 disabled:opacity-30"><ChevronDown class="w-4 h-4" /></button>
                    </div>
                    <button @click="removeFeature(idx)" class="p-2 text-red-300 hover:text-red-500 transition-colors">
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <textarea 
                  v-model="f.description"
                  placeholder="Descrição do recurso..."
                  class="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/10 outline-none text-xs font-medium text-gray-600 resize-none"
                ></textarea>
                <div class="flex items-center gap-3">
                  <BaseCheckbox v-model="f.enabled" :id="'f-enabled-'+idx" />
                  <label :for="'f-enabled-'+idx" class="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer">Ativo na Landpage</label>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
