<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { SwatchBook, MapPin, Briefcase, FileText, Pencil, Image as PhotoIcon, RefreshCcw, X, Instagram, Youtube, Phone, MessageSquare, Plus, Trash2 } from 'lucide-vue-next'
import type { ProfileDTO } from '../../../types'

const { data: profile, refresh } = await useFetch<ProfileDTO>('/api/profile')

watchEffect(() => {
  if (profile.value) {
    if (!profile.value.address) {
      profile.value.address = { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' }
    }
    if (!profile.value.company) {
      profile.value.company = { taxId: '', legalName: '', tradeName: '' }
    }
    if (!profile.value.contact) {
      profile.value.contact = { phones: [{ number: '', isWhatsapp: true }], social: { instagram: '', youtube: '' } }
    }
  }
})

const isSaving = ref(false)
const showCropper = ref(false)
const rawImage = ref<string | null>(null)
const cropperRef = ref<any>(null)

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    rawImage.value = e.target?.result as string
    showCropper.value = true
  }
  reader.readAsDataURL(file)
}

async function cropLogo() {
  if (!cropperRef.value) return
  
  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = 120
  finalCanvas.height = 120
  const ctx = finalCanvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 120, 120)
  ctx.drawImage(canvas, 0, 0, 120, 120)

  const base64Image = finalCanvas.toDataURL('image/png')

  isSaving.value = true
  try {
  const data = await $fetch<any>('/api/upload/cloudinary', {
    method: 'POST',
    body: {
      image: base64Image,
      folder: 'orcei/logos'
    }
  })

  if (profile.value) {
    profile.value.brandConfig.logoUrl = data.url
  }
  showCropper.value = false
  rawImage.value = null  } catch (e) {
    alert('Erro ao fazer upload da imagem')
  } finally {
    isSaving.value = false
  }
}

async function updateProfile() {
  // Validate mandatory fields
  const addr = profile.value!.address
  if (!addr.zip || !addr.street || !addr.neighborhood || !addr.city || !addr.state) {
    return alert('Todos os campos de endereço são obrigatórios (CEP, Rua, Bairro, Cidade e UF)')
  }

  const comp = profile.value!.company
  if (!comp.taxId || !comp.legalName || !comp.tradeName) {
    return alert('Dados da empresa são obrigatórios (CNPJ, Razão Social e Nome Fantasia)')
  }

  isSaving.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PUT',
      body: profile.value
    })
    alert('Configurações salvas!')
    refresh()
  } catch (e) {
    alert('Erro ao salvar configurações')
  } finally {
    isSaving.value = false
  }
}

const activeTab = ref<'contract' | 'terms'>('contract')
const isSearchingCEP = ref(false)

async function searchCEP() {
  if (!profile.value) return
  const cep = profile.value.address.zip?.replace(/\D/g, '')
  if (!cep || cep.length !== 8) return

  isSearchingCEP.value = true
  try {
    const data: any = await $fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (data.erro) {
      alert('CEP não encontrado')
      return
    }
    profile.value.address.street = data.logradouro
    profile.value.address.neighborhood = data.bairro
    profile.value.address.city = data.localidade
    profile.value.address.state = data.uf
  } catch (e) {
    console.error('Erro ao buscar CEP:', e)
  } finally {
    isSearchingCEP.value = false
  }
}

function addPhone() {
  if (!profile.value) return
  profile.value.contact.phones.push({ number: '', isWhatsapp: false })
}

function removePhone(index: number) {
  if (!profile.value) return
  if (profile.value.contact.phones.length > 1) {
    profile.value.contact.phones.splice(index, 1)
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto pb-40 md:pb-20">
    <header class="mb-12">
      <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase">Configurações</h1>
      <p class="text-gray-600 mt-2 text-lg font-medium">Personalize sua identidade corporativa e regras de negócio.</p>
    </header>

    <div v-if="profile" class="space-y-12">
      <!-- Card 1: Identidade Visual -->
      <section class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <SwatchBook class="w-5 h-5 text-blue-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Identidade Visual</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div class="md:col-span-2 flex flex-col md:flex-row items-center gap-10 p-8 bg-gray-50/50 rounded-3xl border border-gray-200">
            <div class="relative group">
              <div class="w-32 h-32 bg-white rounded-3xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 duration-300 ring-1 ring-gray-100">
                <img v-if="profile.brandConfig.logoUrl" :src="profile.brandConfig.logoUrl" class="w-full h-full object-contain">
                <div v-else class="text-gray-300 flex flex-col items-center gap-2">
                  <PhotoIcon class="w-10 h-10 opacity-30" />
                  <span class="text-[8px] font-black uppercase tracking-widest">Logo 120x120</span>
                </div>
              </div>
              <label class="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-xl hover:bg-blue-700 transition-all hover:rotate-12 border-4 border-white">
                <Pencil class="w-5 h-5" />
                <input type="file" accept="image/*" @change="onFileChange" class="hidden">
              </label>
            </div>
            <div class="flex-1 text-center md:text-left">
              <h3 class="text-lg font-black text-gray-900 mb-1 uppercase tracking-tight">Logotipo da Marca</h3>
              <p class="text-sm text-gray-600 font-medium">Recomendado 120x120px. Sua logo aparecerá em todos os orçamentos.</p>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Cor Primária</label>
            <div class="flex gap-3">
              <div class="relative flex-1">
                <input v-model="profile.brandConfig.primaryColor" type="text" class="w-full pl-14 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase font-black text-sm text-gray-900">
                <div class="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg border border-gray-200 shadow-sm" :style="{ backgroundColor: profile.brandConfig.primaryColor }"></div>
              </div>
              <input v-model="profile.brandConfig.primaryColor" type="color" class="w-14 h-15 p-1 bg-white border-2 border-gray-100 rounded-2xl cursor-pointer">
            </div>
          </div>
        </div>
      </section>

      <!-- Card: Dados da Empresa -->
      <section class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Briefcase class="w-5 h-5 text-purple-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Dados da Empresa</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BaseInput v-model="profile.company.tradeName" label="Nome Fantasia" required />
          <BaseInput v-model="profile.company.taxId" label="CNPJ" mask="##.###.###/####-##" required />
          <div class="md:col-span-2">
            <BaseInput v-model="profile.company.legalName" label="Razão Social" required />
          </div>
        </div>
      </section>

      <!-- Card: Endereço (Obrigatório) -->
      <section class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <MapPin class="w-5 h-5 text-orange-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Endereço Comercial</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-3">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">CEP *</label>
            <div class="relative">
              <input v-model="profile.address.zip" @blur="searchCEP" type="text" placeholder="00000-000" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
              <div v-if="isSearchingCEP" class="absolute right-4 top-1/2 -translate-y-1/2">
                <ArrowPath class="w-5 h-5 animate-spin text-blue-600" />
              </div>
            </div>
          </div>
          <div class="md:col-span-2 space-y-3">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Rua / Logradouro *</label>
            <input v-model="profile.address.street" type="text" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
          </div>
          <BaseInput v-model="profile.address.number" label="Número" />
          <BaseInput v-model="profile.address.neighborhood" label="Bairro *" required />
          <BaseInput v-model="profile.address.city" label="Cidade *" required />
          <BaseInput v-model="profile.address.state" label="Estado (UF) *" required />
        </div>
      </section>

      <!-- Card: Contato e Redes Sociais -->
      <section class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Phone class="w-5 h-5 text-blue-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Contato e Redes Sociais</h2>
        </div>

        <div class="space-y-8">
          <!-- Telefones -->
          <div class="space-y-4">
            <div class="flex justify-between items-center px-1">
              <label class="text-xs font-black text-gray-500 uppercase tracking-widest">Telefones</label>
              <button @click="addPhone" class="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <Plus class="w-3 h-3" /> Adicionar Telefone
              </button>
            </div>
            <div v-for="(phone, idx) in profile.contact.phones" :key="idx" class="flex flex-col sm:flex-row gap-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
              <div class="flex-1">
                <BaseInput v-model="phone.number" label="Número" placeholder="(00) 00000-0000" mask="(##) #####-####" />
              </div>
              <div class="flex items-center gap-4 shrink-0">
                <div class="flex items-center gap-2">
                  <BaseCheckbox v-model="phone.isWhatsapp" :id="'wa-'+idx" />
                  <label :for="'wa-'+idx" class="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer flex items-center gap-1.5">
                    <MessageSquare class="w-3 h-3 text-green-500" /> WhatsApp
                  </label>
                </div>
                <button v-if="profile.contact.phones.length > 1" @click="removePhone(idx as number)" class="p-2 text-red-400 hover:text-red-600 transition-colors">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Redes Sociais -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
            <div class="space-y-3">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Instagram class="w-3.5 h-3.5" /> Instagram
              </label>
              <input v-model="profile.contact.social.instagram" type="text" placeholder="@seuusuario" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
            </div>
            <div class="space-y-3">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Youtube class="w-3.5 h-3.5" /> YouTube
              </label>
              <input v-model="profile.contact.social.youtube" type="text" placeholder="Canal" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
            </div>
          </div>
        </div>
      </section>

      <!-- Card 3: Regras de Negócio -->
      <section class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Briefcase class="w-5 h-5 text-emerald-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Regras de Negócio</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="space-y-3">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Validade Padrão</label>
            <div class="relative">
              <input v-model.number="profile.defaultValidityDays" type="number" class="w-full pl-5 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold">
              <span class="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">dias</span>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Parcelamento (Cartão)</label>
            <div class="relative">
              <input v-model.number="profile.defaultInstallments" type="number" class="w-full pl-5 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold">
              <span class="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">x</span>
            </div>
          </div>

          <div class="space-y-3">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Desconto (À Vista)</label>
            <div class="relative">
              <input v-model.number="profile.defaultCashDiscount" type="number" class="w-full pl-5 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold">
              <span class="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">%</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Card 4: Modelos Legais -->
      <section class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <FileText class="w-5 h-5 text-purple-600" />
          </div>
          <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Modelos Legais</h2>
        </div>

        <div class="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-8 max-w-sm">
          <button 
            @click="activeTab = 'contract'"
            :class="activeTab === 'contract' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'"
            class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Contrato
          </button>
          <button 
            @click="activeTab = 'terms'"
            :class="activeTab === 'terms' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'"
            class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
          >
            Termos
          </button>
        </div>

        <div v-show="activeTab === 'contract'" class="space-y-4">
          <div class="flex items-center justify-between ml-1">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Contrato Padrão</label>
            <span class="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Variáveis Suportadas</span>
          </div>
          <RichTextEditor v-model="profile.defaultContractTemplate" class="min-h-[350px] border-2 border-gray-50 rounded-3xl overflow-hidden" />
        </div>

        <div v-show="activeTab === 'terms'" class="space-y-4">
          <div class="flex items-center justify-between ml-1">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Termos e Condições Padrão</label>
            <span class="text-[10px] text-blue-600 font-black uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">Editor Premium</span>
          </div>
          <RichTextEditor v-model="profile.defaultTermsAndConditions" class="min-h-[350px] border-2 border-gray-50 rounded-3xl overflow-hidden" />
        </div>
      </section>

      <!-- Botão de Ação -->
      <div class="flex justify-end pt-6">
        <button 
          @click="updateProfile"
          :disabled="isSaving"
          class="w-full md:w-auto bg-gray-900 text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl shadow-gray-200 disabled:opacity-50 flex items-center justify-center gap-3 text-sm"
        >
          <RefreshCcw v-if="isSaving" class="w-5 h-5 animate-spin" />
          {{ isSaving ? 'Processando...' : 'Salvar Todas as Configurações' }}
        </button>
      </div>
    </div>

    <!-- Modal do Cropper -->
    <Teleport to="body">
      <div v-if="showCropper" class="fixed inset-0 bg-gray-900/90 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
        <div class="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col border-8 border-white">
          <header class="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 class="text-2xl font-black text-gray-900 uppercase tracking-tight">Ajustar Logotipo</h2>
              <p class="text-sm text-gray-500 font-bold">Arraste e redimensione para o enquadramento ideal (1:1)</p>
            </div>
            <button @click="showCropper = false" class="p-3 hover:bg-gray-200 rounded-full transition-all">
              <X class="w-6 h-6 text-gray-400" />
            </button>
          </header>
          
          <div class="p-8 bg-gray-100 flex-1 min-h-[400px]">
            <Cropper
              ref="cropperRef"
              :src="rawImage"
              :stencil-props="{
                aspectRatio: 1/1,
                movable: true,
                resizable: true
              }"
              class="w-full h-[400px]"
            />
          </div>

          <footer class="p-8 border-t border-gray-100 bg-white flex justify-end gap-4">
            <button @click="showCropper = false" class="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
            <button @click="cropLogo" class="px-10 py-4 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">Confirmar Corte</button>
          </footer>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.cropper {
  height: 400px;
  background: #f3f4f6;
}
</style>

ground: #f3f4f6;
}
</style>

