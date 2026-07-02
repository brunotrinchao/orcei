<script setup lang="ts">
import { SwatchBook, MapPin, Briefcase, FileText, Phone, RefreshCcw, Shield, Globe } from 'lucide-vue-next'
import type { ProfileDTO } from '../../../types'
import SettingsVisual from '../../components/settings/SettingsVisual.vue'
import SettingsCompany from '../../components/settings/SettingsCompany.vue'
import SettingsAddress from '../../components/settings/SettingsAddress.vue'
import SettingsContact from '../../components/settings/SettingsContact.vue'
import SettingsTemplates from '../../components/settings/SettingsTemplates.vue'

const { notify } = useAlerts()
const { data: profile, refresh } = useFetch<ProfileDTO>('/api/profile', { key: 'profile' })

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

async function disconnectGoogle() {
  if (!localProfile.value) return
  isSaving.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PUT',
      body: { googleIntegration: null }
    })
    notify('Sucesso', 'Integração com Google removida.')
    refresh()
  } catch {
    notify('Erro', 'Não foi possível desconectar.')
  } finally {
    isSaving.value = false
  }
}

// Navegação lateral
const sections = [
  { id: 'visual',   label: 'Visual',   icon: SwatchBook },
  { id: 'empresa',  label: 'Empresa',  icon: Briefcase },
  { id: 'endereco', label: 'Endereço', icon: MapPin },
  { id: 'contato',  label: 'Contato',  icon: Phone },
  { id: 'integracoes', label: 'Integrações', icon: Globe },
  { id: 'negocio',  label: 'Negócio',  icon: RefreshCcw },
  { id: 'modelos',  label: 'Modelos',  icon: FileText },
  { id: 'privacidade', label: 'Privacidade', icon: Shield },
]

const isExporting = ref(false)
const isDeleting = ref(false)
const { confirm: confirmAlert } = useAlerts()

async function exportData() {
  isExporting.value = true
  try {
    const res: any = await $fetch('/api/profile/backup', { method: 'POST' })
    notify('Sucesso', res.message || 'Backup enviado para seu e-mail.')
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao processar backup.')
  } finally {
    isExporting.value = false
  }
}

const isResetting = ref(false)

async function resetData() {
  if (!localProfile.value) return
  const email = localProfile.value.email

  confirmAlert({
    title: 'Resetar Dados da Conta',
    description: 'Esta ação é IRREVERSÍVEL. Todos os seus Clientes, Catálogo, Orçamentos e Relatórios serão apagados permanentemente. Sua conta, plano e créditos NÃO serão afetados.',
    variant: 'destructive',
    actionText: 'Continuar',
    onConfirm: () => {
      // Segunda confirmação (dupla checagem, mesmo padrão de deleteAccount)
      confirmAlert({
        title: 'Tem Certeza?',
        description: 'Todos os Clientes, Catálogo, Orçamentos e Relatórios serão perdidos para sempre. Confirmar reset?',
        variant: 'destructive',
        actionText: 'Sim, resetar tudo',
        onConfirm: async () => {
          isResetting.value = true
          try {
            await $fetch('/api/profile/reset-data', {
              method: 'POST',
              body: { confirm: email }
            })
            notify('Sucesso', 'Seus dados foram resetados com sucesso.')
            setTimeout(() => window.location.reload(), 1500)
          } catch (e: any) {
            notify('Erro', e.data?.statusMessage || 'Erro ao resetar dados.')
          } finally {
            isResetting.value = false
          }
        }
      })
    }
  })
}

async function deleteAccount() {
  if (!localProfile.value) return

  // 1. Validar se tem plano ativo
  const hasActiveSub = 
    localProfile.value.subscriptionPlan !== 'free' && 
    ['active', 'trialing', 'past_due'].includes(localProfile.value.subscriptionStatus || '')

  if (hasActiveSub) {
    return notify(
      'Ação Necessária', 
      'Você possui uma assinatura ativa. Por favor, cancele seu plano na aba "Assinatura" antes de excluir sua conta.'
    )
  }

  // 2. Diálogo de Confirmação com opção de Backup
  confirmAlert({
    title: 'Encerrar Conta',
    description: `Seus dados (clientes, orçamentos e agenda) serão deletados permanentemente. Seus ${localProfile.value.creditsBalance} créditos restantes ficarão salvos para quando você desejar voltar. \n\nDeseja realizar um backup antes de sair?`,
    variant: 'destructive',
    actionText: 'Fazer Backup e Excluir',
    cancelText: 'Apenas Excluir Minha Conta',
    onConfirm: async () => {
      // Flow A: Backup + Delete
      isDeleting.value = true
      try {
        await $fetch('/api/profile/backup', { method: 'POST' })
        await $fetch('/api/profile', { method: 'DELETE' })
        notify('Até logo', 'Backup enviado e conta excluída. Redirecionando...')
        setTimeout(() => window.location.href = '/', 2000)
      } catch (e: any) {
        notify('Erro', e.data?.statusMessage || 'Erro ao processar exclusão.')
      } finally {
        isDeleting.value = false
      }
    },
    onCancel: async () => {
      // Flow B: Just Delete (Re-confirmar para segurança)
      confirmAlert({
        title: 'Tem Certeza?',
        description: 'Você escolheu excluir a conta SEM backup. Todos os seus dados serão perdidos. Confirmar exclusão?',
        variant: 'destructive',
        actionText: 'Sim, deletar tudo',
        onConfirm: async () => {
          isDeleting.value = true
          try {
            await $fetch('/api/profile', { method: 'DELETE' })
            notify('Até logo', 'Conta excluída. Redirecionando...')
            setTimeout(() => window.location.href = '/', 2000)
          } catch (e: any) {
            notify('Erro', e.data?.statusMessage || 'Erro ao excluir conta.')
          } finally {
            isDeleting.value = false
          }
        }
      })
    }
  })
}

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
          <SettingsVisual
            v-model:logoUrl="localProfile.brandConfig.logoUrl"
            v-model:primaryColor="localProfile.brandConfig.primaryColor"
          />

          <!-- Dados da Empresa -->
          <SettingsCompany
            v-model:company="localProfile.company"
          />

          <!-- Endereço -->
          <SettingsAddress
            v-model:address="localProfile.address"
          />

          <!-- Contato -->
          <SettingsContact
            v-model:contact="localProfile.contact"
          />

          <!-- Integrações -->
          <section id="integracoes" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Globe class="w-5 h-5 text-sky-600" />
              </div>
              <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Integrações</h2>
            </div>

            <div class="space-y-6">
              <div class="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex flex-col sm:flex-row items-center gap-6">
                <div class="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center shrink-0 border border-gray-100">
                  <img src="https://www.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png" class="w-8 h-8 object-contain">
                </div>
                <div class="flex-1 text-center sm:text-left">
                  <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Google Calendar & Drive</h3>
                  <p class="text-xs text-gray-500 font-bold mt-1 leading-relaxed">Sincronize sua agenda e arquive orçamentos automaticamente.</p>
                </div>
                <div class="shrink-0 w-full sm:w-auto">
                  <div v-if="localProfile.googleIntegration?.email" class="flex flex-col items-center sm:items-end gap-2">
                    <span class="text-[10px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">Conectado: {{ localProfile.googleIntegration.email }}</span>
                    <button @click="disconnectGoogle" class="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors">Desconectar</button>
                  </div>
                  <a v-else href="/api/integrations/google/connect" class="inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">
                    Conectar Google
                  </a>
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
          <SettingsTemplates
            v-model:contractTemplate="localProfile.defaultContractTemplate"
            v-model:termsAndConditions="localProfile.defaultTermsAndConditions"
          />

          <!-- Privacidade e Dados -->
          <section id="privacidade" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
            <div class="flex items-center gap-3 mb-8">
              <div class="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Shield class="w-5 h-5 text-red-600" />
              </div>
              <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Privacidade e Dados</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-4">
                <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Backup Completo</h3>
                <p class="text-sm text-gray-500 font-medium leading-relaxed">
                  Exporte todos os seus dados cadastrados (Clientes, Catálogo, Orçamentos e Agenda) em formato JSON. O arquivo será enviado para o seu e-mail.
                </p>
                <BaseButton 
                  variant="secondary" 
                  size="sm" 
                  class="w-full sm:w-auto" 
                  :disabled="isExporting" 
                  :loading="isExporting"
                  @click="exportData"
                >
                  {{ isExporting ? 'Processando...' : 'Exportar Meus Dados' }}
                </BaseButton>
              </div>

              <div class="p-8 bg-orange-50/30 rounded-3xl border border-orange-100 space-y-4">
                <h3 class="text-sm font-black text-orange-900 uppercase tracking-widest">Resetar Dados</h3>
                <p class="text-sm text-orange-700/70 font-medium leading-relaxed">
                  Apaga Clientes, Catálogo, Orçamentos e Relatórios. Sua conta, plano e créditos permanecem intactos. Ação irreversível.
                </p>
                <BaseButton
                  variant="outline"
                  size="sm"
                  class="w-full sm:w-auto text-orange-600 border-orange-200 hover:bg-orange-50"
                  :disabled="isResetting"
                  :loading="isResetting"
                  @click="resetData"
                >
                  {{ isResetting ? 'Resetando...' : 'Resetar Dados' }}
                </BaseButton>
              </div>

              <div class="p-8 bg-red-50/30 rounded-3xl border border-red-100 space-y-4">
                <h3 class="text-sm font-black text-red-900 uppercase tracking-widest">Encerrar Conta</h3>
                <p class="text-sm text-red-700/70 font-medium leading-relaxed">
                  Ao excluir sua conta, todos os seus dados serão apagados permanentemente. Esta ação não pode ser desfeita.
                </p>
                <BaseButton 
                  variant="outline" 
                  size="sm" 
                  class="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50" 
                  :disabled="isDeleting" 
                  :loading="isDeleting"
                  @click="deleteAccount"
                >
                  {{ isDeleting ? 'Excluindo...' : 'Excluir Minha Conta' }}
                </BaseButton>
              </div>
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
