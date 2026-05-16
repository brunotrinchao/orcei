<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { SwatchBook, MapPin, Briefcase, FileText, Pencil, Image as PhotoIcon, RefreshCcw, Instagram, Youtube, Phone, MessageSquare, Plus, Trash2 } from 'lucide-vue-next'
import type { ProfileDTO } from '../../../types'

const { notify } = useAlerts()
const { data: profile, refresh } = useFetch<ProfileDTO>('/api/profile')

const localProfile = ref<ProfileDTO | null>(null)

watch(profile, (val) => {
  if (!val) return
  const clone: ProfileDTO = JSON.parse(JSON.stringify(val))
  if (!clone.address) {
    clone.address = { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' }
  }
  if (!clone.company) {
    clone.company = { taxId: '', legalName: '', tradeName: '' }
  }
  if (!clone.contact) {
    clone.contact = { phones: [{ number: '', isWhatsapp: true }], social: { instagram: '', youtube: '' } }
  }
  localProfile.value = clone
}, { immediate: true })

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

  isSaving.value = true
  try {
    const data = await $fetch<any>('/api/upload/cloudinary', {
      method: 'POST',
      body: { image: finalCanvas.toDataURL('image/png'), folder: 'orcei/logos' }
    })
    if (localProfile.value) localProfile.value.brandConfig.logoUrl = data.url
    showCropper.value = false
    rawImage.value = null
  } catch {
    notify('Erro', 'Não foi possível fazer upload da imagem.')
  } finally {
    isSaving.value = false
  }
}

async function updateProfile() {
  if (!localProfile.value) return
  const addr = localProfile.value.address
  if (!addr.zip || !addr.street || !addr.neighborhood || !addr.city || !addr.state) {
    return notify('Aviso', 'Todos os campos de endereço são obrigatórios.')
  }
  const comp = localProfile.value.company
  if (!comp.taxId || !comp.legalName || !comp.tradeName) {
    return notify('Aviso', 'Dados da empresa são obrigatórios.')
  }

  isSaving.value = true
  try {
    await $fetch('/api/profile', { method: 'PUT', body: localProfile.value })
    notify('Sucesso', 'Configurações salvas com sucesso!')
    refresh()
  } catch {
    notify('Erro', 'Ocorreu uma falha ao salvar as configurações.')
  } finally {
    isSaving.value = false
  }
}

const activeTab = ref<'contract' | 'terms'>('contract')
const isSearchingCEP = ref(false)

async function searchCEP() {
  if (!localProfile.value) return
  const cep = localProfile.value.address.zip?.replace(/\D/g, '')
  if (!cep || cep.length !== 8) return
  isSearchingCEP.value = true
  try {
    const data: any = await $fetch(`https://viacep.com.br/ws/${cep}/json/`)
    if (!data.erro) {
      localProfile.value.address.street = data.logradouro
      localProfile.value.address.neighborhood = data.bairro
      localProfile.value.address.city = data.localidade
      localProfile.value.address.state = data.uf
    }
  } catch {} finally {
    isSearchingCEP.value = false
  }
}

function addPhone() {
  if (!localProfile.value) return
  localProfile.value.contact.phones.push({ number: '', isWhatsapp: false })
}

function removePhone(index: number) {
  if (!localProfile.value) return
  if (localProfile.value.contact.phones.length > 1) {
    localProfile.value.contact.phones.splice(index, 1)
  }
}

// Navegação lateral
const sections = [
  { id: 'visual',   label: 'Visual',   icon: SwatchBook },
  { id: 'empresa',  label: 'Empresa',  icon: Briefcase },
  { id: 'endereco', label: 'Endereço', icon: MapPin },
  { id: 'contato',  label: 'Contato',  icon: Phone },
  { id: 'negocio',  label: 'Negócio',  icon: RefreshCcw },
  { id: 'modelos',  label: 'Modelos',  icon: FileText },
]

const activeSection = ref('visual')

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeSection.value = id
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length) activeSection.value = visible[0].target.id
    },
    { threshold: 0.3 }
  )
  sections.forEach(s => {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  })
})
</script>

<template>
  <div class="max-w-6xl mx-auto pb-40 md:pb-20">
    <PageHeader title="Configurações" subtitle="Personalize sua identidade corporativa e regras de negócio." />

    <div v-if="localProfile">

      <!-- Mobile nav pills (acima do conteúdo) -->
      <div class="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
        <button
          v-for="s in sections"
          :key="s.id"
          @click="scrollTo(s.id)"
          :class="activeSection === s.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-500'"
          class="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <component :is="s.icon" class="w-3 h-3" />
          {{ s.label }}
        </button>
      </div>

      <!-- Layout desktop: sidebar + conteúdo -->
      <div class="flex gap-8 items-start">

        <!-- Sidebar (desktop only) -->
        <aside class="hidden lg:flex flex-col gap-1 w-44 shrink-0 sticky top-24">
          <button
            v-for="s in sections"
            :key="s.id"
            @click="scrollTo(s.id)"
            :class="activeSection === s.id
              ? 'bg-gray-900 text-white shadow-lg'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'"
            class="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all text-left"
          >
            <component :is="s.icon" class="w-4 h-4 shrink-0" />
            {{ s.label }}
          </button>
          <div class="pt-4 mt-2 border-t border-gray-100">
            <BaseButton type="button" size="sm" :disabled="isSaving" :loading="isSaving" @click="updateProfile" class="w-full">
              {{ isSaving ? 'Salvando...' : 'Salvar' }}
            </BaseButton>
          </div>
        </aside>

      <!-- Sections -->
      <div class="flex-1 space-y-10 min-w-0">

        <!-- Identidade Visual -->
        <section id="visual" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <SwatchBook class="w-5 h-5 text-blue-600" />
            </div>
            <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Identidade Visual</h2>
          </div>

          <!-- Cropper inline -->
          <div v-if="showCropper" class="space-y-6">
            <p class="text-sm text-gray-500 font-bold">Arraste e redimensione para o enquadramento ideal (1:1)</p>
            <div class="bg-gray-100 rounded-3xl overflow-hidden">
              <Cropper
                ref="cropperRef"
                :src="rawImage"
                :stencil-props="{ aspectRatio: 1/1, movable: true, resizable: true }"
                class="w-full h-[360px]"
              />
            </div>
            <div class="flex justify-end gap-3">
              <button type="button" @click="showCropper = false" class="px-6 py-3 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-all">Cancelar</button>
              <BaseButton type="button" :disabled="isSaving" :loading="isSaving" @click="cropLogo">Confirmar Corte</BaseButton>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div class="md:col-span-2 flex flex-col md:flex-row items-center gap-10 p-8 bg-gray-50/50 rounded-3xl border border-gray-200">
              <div class="relative group">
                <div class="w-32 h-32 bg-white rounded-3xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 duration-300 ring-1 ring-gray-100">
                  <img v-if="localProfile.brandConfig?.logoUrl" :src="localProfile.brandConfig.logoUrl" class="w-full h-full object-contain">
                  <div v-else class="text-gray-300 flex flex-col items-center gap-2">
                    <PhotoIcon class="w-10 h-10 opacity-30" />
                    <span class="text-[8px] font-black uppercase tracking-widest">120×120px</span>
                  </div>
                </div>
                <label class="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-xl hover:bg-blue-700 transition-all hover:rotate-12 border-4 border-white">
                  <Pencil class="w-5 h-5" />
                  <input type="file" accept="image/*" @change="onFileChange" class="hidden">
                </label>
              </div>
              <div class="flex-1 text-center md:text-left">
                <h3 class="text-lg font-black text-gray-900 mb-1 uppercase tracking-tight">Logotipo da Marca</h3>
                <p class="text-sm text-gray-600 font-medium">Recomendado 120×120px. Aparece em todos os orçamentos.</p>
              </div>
            </div>

            <div class="space-y-3">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Cor Primária</label>
              <div class="flex gap-3" v-if="localProfile.brandConfig">
                <div class="relative flex-1">
                  <input v-model="localProfile.brandConfig.primaryColor" type="text" class="w-full pl-14 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase font-black text-sm text-gray-900">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg border border-gray-200 shadow-sm" :style="{ backgroundColor: localProfile.brandConfig.primaryColor }"></div>
                </div>
                <input v-model="localProfile.brandConfig.primaryColor" type="color" class="w-14 h-15 p-1 bg-white border-2 border-gray-100 rounded-2xl cursor-pointer">
              </div>
            </div>
          </div>
        </section>

        <!-- Dados da Empresa -->
        <section id="empresa" v-if="localProfile.company" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Briefcase class="w-5 h-5 text-purple-600" />
            </div>
            <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Dados da Empresa</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseInput v-model="localProfile.company.tradeName" label="Nome Fantasia" required />
            <BaseInput v-model="localProfile.company.taxId" label="CNPJ" mask="cnpj" required />
            <div class="md:col-span-2">
              <BaseInput v-model="localProfile.company.legalName" label="Razão Social" required />
            </div>
          </div>
        </section>

        <!-- Endereço -->
        <section id="endereco" v-if="localProfile.address" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
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
                <input v-model="localProfile.address.zip" @blur="searchCEP" type="text" placeholder="00000-000" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
                <div v-if="isSearchingCEP" class="absolute right-4 top-1/2 -translate-y-1/2">
                  <RefreshCcw class="w-5 h-5 animate-spin text-blue-600" />
                </div>
              </div>
            </div>
            <div class="md:col-span-2 space-y-3">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Rua / Logradouro *</label>
              <input v-model="localProfile.address.street" type="text" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
            </div>
            <BaseInput v-model="(localProfile.address.number as any)" label="Número" />
            <BaseInput v-model="localProfile.address.neighborhood" label="Bairro *" required />
            <BaseInput v-model="localProfile.address.city" label="Cidade *" required />
            <BaseInput v-model="localProfile.address.state" label="Estado (UF) *" required />
          </div>
        </section>

        <!-- Contato -->
        <section id="contato" v-if="localProfile.contact" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Phone class="w-5 h-5 text-blue-600" />
            </div>
            <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Contato e Redes Sociais</h2>
          </div>

          <div class="space-y-8">
            <div class="space-y-4">
              <div class="flex justify-between items-center px-1">
                <label class="text-xs font-black text-gray-500 uppercase tracking-widest">Telefones</label>
                <button @click="addPhone" class="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
                  <Plus class="w-3 h-3" /> Adicionar
                </button>
              </div>
              <div v-for="(phone, idx) in localProfile.contact.phones" :key="idx" class="flex flex-col sm:flex-row gap-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                <div class="flex-1">
                  <BaseInput v-model="phone.number" label="Número" placeholder="(00) 00000-0000" mask="phone" />
                </div>
                <div class="flex items-center gap-4 shrink-0">
                  <div class="flex items-center gap-2">
                    <BaseCheckbox v-model="phone.isWhatsapp" :id="'wa-'+idx" />
                    <label :for="'wa-'+idx" class="text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer flex items-center gap-1.5">
                      <MessageSquare class="w-3 h-3 text-green-500" /> WhatsApp
                    </label>
                  </div>
                  <button v-if="localProfile.contact.phones.length > 1" @click="removePhone(idx as number)" class="p-2 text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100" v-if="localProfile.contact.social">
              <div class="space-y-3">
                <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Instagram class="w-3.5 h-3.5" /> Instagram
                </label>
                <input v-model="localProfile.contact.social.instagram" type="text" placeholder="@seuusuario" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
              </div>
              <div class="space-y-3">
                <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Youtube class="w-3.5 h-3.5" /> YouTube
                </label>
                <input v-model="localProfile.contact.social.youtube" type="text" placeholder="Canal" class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold">
              </div>
            </div>
          </div>
        </section>

        <!-- Regras de Negócio -->
        <section id="negocio" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
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
                <input v-model.number="localProfile.defaultValidityDays" type="number" class="w-full pl-5 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold">
                <span class="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">dias</span>
              </div>
            </div>
            <div class="space-y-3">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Parcelamento (Cartão)</label>
              <div class="relative">
                <input v-model.number="localProfile.defaultInstallments" type="number" class="w-full pl-5 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold">
                <span class="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">x</span>
              </div>
            </div>
            <div class="space-y-3">
              <label class="block text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Desconto (À Vista)</label>
              <div class="relative">
                <input v-model.number="localProfile.defaultCashDiscount" type="number" class="w-full pl-5 pr-16 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none font-bold">
                <span class="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 uppercase">%</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Modelos Legais -->
        <section id="modelos" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
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
            >Contrato</button>
            <button
              @click="activeTab = 'terms'"
              :class="activeTab === 'terms' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'"
              class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            >Termos</button>
          </div>

          <div v-show="activeTab === 'contract'" class="space-y-4">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Contrato Padrão</label>
            <RichTextEditor v-model="localProfile.defaultContractTemplate" class="min-h-[350px] border-2 border-gray-50 rounded-3xl overflow-hidden" />
          </div>
          <div v-show="activeTab === 'terms'" class="space-y-4">
            <label class="block text-xs font-black text-gray-500 uppercase tracking-widest">Termos e Condições</label>
            <RichTextEditor v-model="localProfile.defaultTermsAndConditions" class="min-h-[350px] border-2 border-gray-50 rounded-3xl overflow-hidden" />
          </div>
        </section>

      </div> <!-- end sections -->
      </div> <!-- end desktop flex -->

      <!-- Salvar (mobile) -->
      <div class="lg:hidden pt-6">
        <BaseButton type="button" :disabled="isSaving" :loading="isSaving" @click="updateProfile" class="w-full">
          {{ isSaving ? 'Salvando...' : 'Salvar Todas as Configurações' }}
        </BaseButton>
      </div>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
