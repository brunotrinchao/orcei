import { ref, watch } from 'vue'
import { SwatchBook, MapPin, Briefcase, FileText, Phone, RefreshCcw, Shield, Globe, ShieldCheck, Lock, CheckCircle2, Wand2, Upload } from 'lucide-vue-next'
import type { ProfileDTO } from '~/types'

export function useConfiguracoesPage() {
  const { notify, confirm: confirmAlert } = useAlerts()
  const { data: profile, refresh } = useFetch<ProfileDTO>('/api/profile', { key: 'profile' })
  const { openSetupWizard } = useOnboarding()
  const { public: publicConfig } = useRuntimeConfig()
  const integrationGoogleDriveCalendarStatus = publicConfig.integrationGoogleDriveCalendarStatus

  const localProfile = ref<ProfileDTO | null>(null)

  watch(profile, (val) => {
    if (!val) return
    const clone: ProfileDTO = JSON.parse(JSON.stringify(val))
    if (!clone.brandConfig) {
      clone.brandConfig = { primaryColor: '#3147F6', logoUrl: '' }
    } else {
      clone.brandConfig.primaryColor ??= '#3147F6'
      clone.brandConfig.logoUrl ??= ''
    }
    if (!clone.address) {
      clone.address = { street: '', number: '', neighborhood: '', city: '', state: '', zip: '' }
    }
    if (!clone.company) {
      clone.company = { taxId: '', legalName: '', tradeName: '' }
    }
    if (!clone.contact) {
      clone.contact = { phones: [{ number: '', isWhatsapp: true }], social: { instagram: '', youtube: '', facebook: '', twitter: '' } }
    }
    if (!clone.contact.social) {
      clone.contact.social = { instagram: '', youtube: '', facebook: '', twitter: '' }
    } else {
      clone.contact.social.facebook ??= ''
      clone.contact.social.twitter ??= ''
    }
    clone.defaultAcceptCreditCard ??= false
    localProfile.value = clone
  }, { immediate: true })

  const isSaving = ref(false)

  const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
  const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

  function hasGoogleScope(scope: string) {
    return !!localProfile.value?.googleIntegration?.refreshToken
      && !!localProfile.value?.googleIntegration?.grantedScopes?.includes(scope)
  }

  const isDisconnecting = ref(false)
  const isConnecting = ref(false)
  const { connect } = useGoogleConnect()

  async function handleConnect(feature: 'drive' | 'calendar') {
    isConnecting.value = true
    try {
      const ok = await connect(feature)
      if (ok) {
        await refresh()
        notify('Sucesso', 'Integração conectada com sucesso.')
      }
    } finally {
      isConnecting.value = false
    }
  }

  async function disconnectGoogle() {
    isDisconnecting.value = true
    try {
      await $fetch('/api/integrations/google/disconnect', { method: 'POST' })
      await refresh()
      notify('Integração desconectada', 'Sua conta Google foi desconectada com sucesso.')
    } catch (e: any) {
      notify('Erro ao desconectar', e?.data?.statusMessage || 'Não foi possível desconectar sua conta Google.')
    } finally {
      isDisconnecting.value = false
    }
  }

  const { validate } = useFormValidation()
  const { success, error } = useToast()

  async function updateProfile() {
    if (!localProfile.value) return
    if (!validate()) return

    isSaving.value = true
    try {
      await $fetch('/api/profile', { method: 'PUT', body: localProfile.value })
      success('Sucesso', 'Configurações salvas com sucesso!', {
        position: 'top-right',
        delay: 4000
      })
      refresh()
    } catch {
      error('Erro', 'Ocorreu uma falha ao salvar as configurações. Tente novamente.', {
        position: 'top-right',
        delay: 5000
      })
    } finally {
      isSaving.value = false
    }
  }

  const sections = [
    {
      id: 'visual',
      label: 'Identidade Visual',
      icon: SwatchBook,
      description: 'Personalize o logotipo da sua marca e a cor primária para personalização visual em todas as suas propostas e orçamentos.'
    },
    {
      id: 'empresa',
      label: 'Dados da Empresa',
      icon: Briefcase,
      description: 'Cadastre os dados cadastrais corporativos como CNPJ/CPF, razão social, nome fantasia e inscrições estaduais ou municipais.'
    },
    {
      id: 'endereco',
      label: 'Endereço',
      icon: MapPin,
      description: 'Mantenha o endereço comercial atualizado para exibição automática nos cabeçalhos de orçamentos e contratos.'
    },
    {
      id: 'contato',
      label: 'Contato',
      icon: Phone,
      description: 'Gerencie os números de telefone comerciais (com suporte a identificação WhatsApp) e os links das suas redes sociais.'
    },
    {
      id: 'integracoes',
      label: 'Integrações',
      icon: Globe,
      description: 'Conecte com segurança suas contas Google Calendar para agendamentos e Google Drive para backup automático em PDF dos orçamentos.'
    },
    {
      id: 'multiplos-cadastros',
      label: 'Múltiplos Cadastros',
      icon: Upload,
      description: 'Importe listas completas de clientes e itens do seu catálogo rapidamente utilizando modelos de planilhas CSV.'
    },
    {
      id: 'negocio',
      label: 'Regras de Negócio',
      icon: RefreshCcw,
      description: 'Defina prazos de validade padrão para novos orçamentos, descontos à vista e parâmetros de aceitação para pagamento em cartão.'
    },
    {
      id: 'modelos',
      label: 'Modelos Legais',
      icon: FileText,
      description: 'Customize os minutas dos contratos e termos de aceite utilizando variáveis dinâmicas pré-definidas para automação dos documentos.'
    },
    {
      id: 'privacidade',
      label: 'Privacidade e Dados',
      icon: Shield,
      description: 'Gerencie sua privacidade com opções de exportação de dados em JSON (backup completo), reset de dados operacionais ou exclusão de conta.'
    },
  ]

  const activeSectionData = computed(() => {
    return sections.find(s => s.id === activeSection.value) || sections[0]
  })

  const isExporting = ref(false)
  const isDeleting = ref(false)
  const isDeleteModalOpen = ref(false)

  /** Executa a exclusão (com ou sem backup) — usada pelo modal de Encerrar Conta */
  async function confirmDeleteAccount(withBackup: boolean) {
    isDeleting.value = true
    try {
      if (withBackup) {
        await $fetch('/api/profile/backup', { method: 'POST' })
      }
      await $fetch('/api/profile', { method: 'DELETE' })
      notify(
        withBackup ? 'Até logo' : 'Conta excluída',
        withBackup ? 'Backup enviado e conta excluída. Redirecionando...' : 'Redirecionando...'
      )
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (e: any) {
      notify('Erro', e.data?.statusMessage || 'Erro ao processar exclusão.')
    } finally {
      isDeleting.value = false
      isDeleteModalOpen.value = false
    }
  }

  function exportData() {
    confirmAlert({
      title: 'Gerar Backup',
      description: 'O backup completo (clientes, orçamentos, catálogo, relatórios) será gerado e enviado para o seu e-mail. <strong>Permitido apenas 1 backup por dia.</strong> Continuar?',
      actionText: 'Gerar Backup',
      cancelText: 'Cancelar',
      onConfirm: async () => {
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
    })
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

  function deleteAccount() {
    if (!localProfile.value) return

    const hasActiveSub =
      localProfile.value.subscriptionPlan !== 'free' &&
      ['active', 'trialing', 'past_due'].includes(localProfile.value.subscriptionStatus || '')

    if (hasActiveSub) {
      return notify(
        'Ação Necessária',
        'Você possui uma assinatura ativa. Por favor, cancele seu plano na aba "Assinatura" antes de excluir sua conta.'
      )
    }

    // Abre o modal com 3 opções: Cancelar / Excluir conta / Backup e Excluir
    isDeleteModalOpen.value = true
  }

  const route = useRoute()
  const router = useRouter()
  const initialSection = typeof route.query.section === 'string' && sections.some(s => s.id === route.query.section)
    ? route.query.section
    : 'visual'
  const activeSection = ref(initialSection)

  watch(() => route.query.section, (newSection) => {
    if (typeof newSection === 'string' && sections.some(s => s.id === newSection)) {
      activeSection.value = newSection
    }
  })

  function selectSection(id: string) {
    activeSection.value = id
    router.replace({ query: { ...route.query, section: id } })
  }

  return {
    profile,
    refresh,
    openSetupWizard,
    integrationGoogleDriveCalendarStatus,
    localProfile,
    isSaving,
    GOOGLE_CALENDAR_SCOPE,
    GOOGLE_DRIVE_SCOPE,
    hasGoogleScope,
    isDisconnecting,
    isConnecting,
    handleConnect,
    disconnectGoogle,
    updateProfile,
    sections,
    isExporting,
    isDeleting,
    isDeleteModalOpen,
    confirmDeleteAccount,
    exportData,
    isResetting,
    resetData,
    deleteAccount,
    activeSection,
    activeSectionData,
    selectSection,
    SwatchBook,
    MapPin,
    Briefcase,
    FileText,
    Phone,
    RefreshCcw,
    Shield,
    Globe,
    ShieldCheck,
    Lock,
    CheckCircle2,
    Wand2,
    Upload,
  }
}
