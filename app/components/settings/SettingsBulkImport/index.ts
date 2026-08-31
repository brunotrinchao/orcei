import { ref } from 'vue'
import { Upload, Download, Users, Package, FileSpreadsheet, Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-vue-next'

export function useSettingsBulkImport() {
  const modalOpen = ref(false)
  const modalType = ref<'client' | 'catalog'>('client')

  function openModal(type: 'client' | 'catalog') {
    modalType.value = type
    modalOpen.value = true
  }

  const cards = [
    {
      type: 'client' as const,
      title: 'Importar Clientes',
      badge: 'Contatos & Empresas',
      badgeVariant: 'info',
      description: 'Cadastre dezenas ou centenas de clientes de forma automatizada enviando uma planilha CSV.',
      icon: Users,
      accentColor: 'bg-blue-500',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300',
      templateHref: '/templates/modelo-clientes.csv',
      fields: ['Nome / Razão Social', 'CPF / CNPJ', 'E-mail', 'Telefone / WhatsApp', 'Endereço Completo']
    },
    {
      type: 'catalog' as const,
      title: 'Importar Catálogo',
      badge: 'Produtos & Serviços',
      badgeVariant: 'success',
      description: 'Agilize o cadastro dos seus itens de catálogo com preços, unidades e categorias via planilha CSV.',
      icon: Package,
      accentColor: 'bg-emerald-500',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300',
      templateHref: '/templates/modelo-catalogo.csv',
      fields: ['Código / SKU', 'Nome do Item', 'Descrição', 'Preço Unitário (R$)', 'Unidade de Medida']
    }
  ]

  const importSteps = [
    {
      step: '01',
      title: 'Baixar Modelo',
      description: 'Baixe o modelo oficial no formato CSV formatado para a estrutura do Orcei.'
    },
    {
      step: '02',
      title: 'Preencher Dados',
      description: 'Abra no Excel ou Google Sheets e preencha as colunas sem alterar os cabeçalhos.'
    },
    {
      step: '03',
      title: 'Enviar e Validar',
      description: 'Faça o upload do arquivo. Nosso sistema valida os dados e importa tudo em segundos.'
    }
  ]

  return {
    modalOpen,
    modalType,
    openModal,
    cards,
    importSteps,
    Upload,
    Download,
    Users,
    Package,
    FileSpreadsheet,
    Sparkles,
    ArrowRight,
    CheckCircle2,
    AlertCircle
  }
}
