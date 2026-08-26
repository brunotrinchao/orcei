import { ref, computed, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Search, Plus, Pencil, Trash2, RefreshCcw, MapPin, Mail, Phone, ExternalLink, MoreVertical, Upload, FileText, CheckCircle2, XCircle, Clock, TrendingUp, DollarSign, User, Building2 } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { ClientDTO } from '~/types'

export function useClientesPage() {
  const { notify, confirm: confirmAlert } = useAlerts()

  const searchQuery = ref('')
  const itemsPerPage = 10
  const query = computed(() => ({ search: searchQuery.value }))
  const {
    items: clients,
    total: totalClients,
    pending,
    loadingMore,
    hasMore,
    loadMore,
    reset: refresh,
  } = useInfiniteList('/api/clients', query, { itemsPerPage })

  const mobileSentinelRef = ref<HTMLElement | null>(null)
  useIntersectionObserver(mobileSentinelRef, ([entry]) => {
    if (entry?.isIntersecting && hasMore.value && !loadingMore.value) {
      loadMore()
    }
  }, { threshold: 0.1 })

  const showForm = ref(false)
  const showInfo = ref(false)
  const { validate, reset: resetValidation } = useFormValidation()
  watch(showForm, (open) => { if (!open) resetValidation() })
  const selectedClient = ref<ClientDTO | null>(null)
  const clientStats = ref<any>(null)
  const loadingStats = ref(false)

  const form = ref({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    isWhatsapp: true,
    address: {
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      zip: ''
    },
    notes: ''
  })

  const isSubmitting = ref(false)
  const isSearchingZip = ref(false)

  async function openInfoModal(client: ClientDTO) {
    selectedClient.value = client
    showInfo.value = true
    loadingStats.value = true
    clientStats.value = null
    try {
      const data: any = await $fetch(`/api/clients/${client._id}/stats`)
      clientStats.value = data
    } catch (e) {
      console.error('Erro ao carregar estatísticas do cliente:', e)
    } finally {
      loadingStats.value = false
    }
  }

  function formatCurrency(value: number = 0) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'accepted':
        return { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' }
      case 'expired':
        return { label: 'Recusado', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800' }
      case 'draft':
        return { label: 'Rascunho', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700' }
      default:
        return { label: 'Em Aberto', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800' }
    }
  }

  const formattedAddress = computed(() => {
    if (!selectedClient.value?.address) return null
    const addr = selectedClient.value.address
    const parts = []
    if (addr.street) {
      let line = addr.street
      if (addr.number) line += `, ${addr.number}`
      parts.push(line)
    }
    if (addr.neighborhood) parts.push(addr.neighborhood)
    if (addr.city || addr.state) {
      const loc = [addr.city, addr.state].filter(Boolean).join(' - ')
      parts.push(loc)
    }
    if (addr.zip) parts.push(`CEP: ${addr.zip}`)
    return parts.length > 0 ? parts.join(' • ') : null
  })

  function openModal(client: ClientDTO | null = null) {
    if (client) {
      selectedClient.value = client
      form.value = {
        name: client.name ?? '',
        taxId: client.taxId ?? '',
        email: client.email ?? '',
        phone: client.phone ?? '',
        isWhatsapp: client.isWhatsapp ?? true,
        address: {
          street: client.address?.street ?? '',
          number: client.address?.number ?? '',
          neighborhood: client.address?.neighborhood ?? '',
          city: client.address?.city ?? '',
          state: client.address?.state ?? '',
          zip: client.address?.zip ?? ''
        },
        notes: client.notes ?? ''
      }
    } else {
      selectedClient.value = null
      form.value = {
        name: '',
        taxId: '',
        email: '',
        phone: '',
        isWhatsapp: true,
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          zip: ''
        },
        notes: ''
      }
    }
    showForm.value = true
  }

  async function searchZip() {
    const zip = form.value.address.zip.replace(/\D/g, '')
    if (zip.length !== 8) return

    isSearchingZip.value = true
    try {
      const data: any = await $fetch(`https://viacep.com.br/ws/${zip}/json/`)
      if (!data.erro) {
        form.value.address.street = data.logradouro
        form.value.address.neighborhood = data.bairro
        form.value.address.city = data.localidade
        form.value.address.state = data.uf
      }
    } catch (e) {
      console.error('Erro ao buscar CEP', e)
    } finally {
      isSearchingZip.value = false
    }
  }

  async function saveClient() {
    if (!validate()) return
    isSubmitting.value = true
    try {
      const method = selectedClient.value ? 'PUT' : 'POST'
      const endpoint = selectedClient.value ? `/api/clients/${selectedClient.value._id}` : '/api/clients'
      
      await $fetch(endpoint, {
        method,
        body: form.value
      })
      showForm.value = false
      refresh()
    } catch (e: any) {
      const html = parseApiErrors(e)
      notify(html ? 'Dados inválidos' : 'Erro', html ?? (e.data?.statusMessage || 'Erro ao salvar cliente'))
    } finally {
      isSubmitting.value = false
    }
  }

  async function deleteClient(id: string) {
    confirmAlert({
      title: 'Excluir Cliente',
      description: 'Tem certeza que deseja excluir este cliente?',
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await $fetch(`/api/clients/${id}`, { method: 'DELETE' })
          refresh()
        } catch (e) {
          notify('Erro', 'Erro ao excluir cliente')
        }
      }
    })
  }

  const activeFiltersCount = computed(() => {
    return searchQuery.value ? 1 : 0
  })

  function clearFilters() {
    searchQuery.value = ''
  }

  const formatPhone = (phone: string) => {
    const r = phone.replace(/\D/g, '')
    if (r.length === 11) {
      return `(${r.substring(0, 2)}) ${r.substring(2, 7)}-${r.substring(7)}`
    }
    if (r.length === 10) {
      return `(${r.substring(0, 2)}) ${r.substring(2, 6)}-${r.substring(6)}`
    }
    return phone
  }

  const stateMap: Record<string, { label: string; uf: string }> = {
    ac: { label: 'Acre', uf: 'AC' },
    al: { label: 'Alagoas', uf: 'AL' },
    ap: { label: 'Amapá', uf: 'AP' },
    am: { label: 'Amazonas', uf: 'AM' },
    ba: { label: 'Bahia', uf: 'BA' },
    ce: { label: 'Ceará', uf: 'CE' },
    df: { label: 'Distrito Federal', uf: 'DF' },
    es: { label: 'Espírito Santo', uf: 'ES' },
    go: { label: 'Goiás', uf: 'GO' },
    ma: { label: 'Maranhão', uf: 'MA' },
    mt: { label: 'Mato Grosso', uf: 'MT' },
    ms: { label: 'Mato Grosso do Sul', uf: 'MS' },
    mg: { label: 'Minas Gerais', uf: 'MG' },
    pa: { label: 'Pará', uf: 'PA' },
    pb: { label: 'Paraíba', uf: 'PB' },
    pr: { label: 'Paraná', uf: 'PR' },
    pe: { label: 'Pernambuco', uf: 'PE' },
    pi: { label: 'Piauí', uf: 'PI' },
    rj: { label: 'Rio de Janeiro', uf: 'RJ' },
    rn: { label: 'Rio Grande do Norte', uf: 'RN' },
    rs: { label: 'Rio Grande do Sul', uf: 'RS' },
    ro: { label: 'Rondônia', uf: 'RO' },
    rr: { label: 'Roraima', uf: 'RR' },
    sc: { label: 'Santa Catarina', uf: 'SC' },
    sp: { label: 'São Paulo', uf: 'SP' },
    se: { label: 'Sergipe', uf: 'SE' },
    to: { label: 'Tocantins', uf: 'TO' }
  }

  return {
    searchQuery,
    clients,
    totalClients,
    pending,
    loadingMore,
    hasMore,
    loadMore,
    refresh,
    mobileSentinelRef,
    showForm,
    showInfo,
    selectedClient,
    clientStats,
    loadingStats,
    form,
    isSubmitting,
    isSearchingZip,
    openInfoModal,
    formatCurrency,
    getStatusBadge,
    formattedAddress,
    openModal,
    searchZip,
    saveClient,
    deleteClient,
    activeFiltersCount,
    clearFilters,
    formatPhone,
    stateMap,
    Search,
    Plus,
    Pencil,
    Trash2,
    RefreshCcw,
    MapPin,
    Mail,
    Phone,
    ExternalLink,
    MoreVertical,
    Upload,
    FileText,
    CheckCircle2,
    XCircle,
    Clock,
    TrendingUp,
    DollarSign,
    User,
    Building2,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    DropdownMenuPortal,
    DropdownMenuContent,
    DropdownMenuItem,
  }
}
