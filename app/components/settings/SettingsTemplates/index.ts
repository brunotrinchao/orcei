import { ref, computed } from 'vue'
import { FileText, Variable, Copy, Check } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'

export function useSettingsTemplates(
  props: { contractTemplate: string; termsAndConditions: string },
  emit: { (e: 'update:contractTemplate', val: string): void; (e: 'update:termsAndConditions', val: string): void }
) {
  const { copy } = useClipboard()

  const availableVariables = [
    { tag: '{{nome_cliente}}', desc: 'Nome do cliente' },
    { tag: '{{valor_total}}', desc: 'Valor final do orçamento' },
    { tag: '{{dias_validade}}', desc: 'Dias restantes de validade' },
    { tag: '{{forma_pagamento}}', desc: 'Método (À Vista / Cartão)' },
    { tag: '{{detalhes_pagamento}}', desc: 'Ex: Parcelado em 3x...' },
    { tag: '{{nome_empresa}}', desc: 'Nome do perfil' },
    { tag: '{{nome_fantasia}}', desc: 'Nome fantasia da empresa' },
    { tag: '{{razao_social}}', desc: 'Razão social da empresa' },
    { tag: '{{cnpj}}', desc: 'CNPJ do prestador' },
    { tag: '{{telefone}}', desc: 'Telefone do prestador' },
    { tag: '{{endereco_prestador}}', desc: 'Endereço completo' },
    { tag: '{{cep}}', desc: 'CEP do prestador' },
    { tag: '{{rua}}', desc: 'Rua do prestador' },
    { tag: '{{numero}}', desc: 'Número do endereço' },
    { tag: '{{bairro}}', desc: 'Bairro do prestador' },
    { tag: '{{cidade}}', desc: 'Cidade do prestador' },
    { tag: '{{estado}}', desc: 'Estado do prestador' },
    { tag: '{{data_inicio}}', desc: 'Data de início do serviço' },
  ]

  const copiedTag = ref('')
  function copyTag(tag: string) {
    copy(tag)
    copiedTag.value = tag
    setTimeout(() => copiedTag.value = '', 2000)
  }

  const activeTab = ref<'contract' | 'terms'>('contract')

  const localContractTemplate = computed({
    get: () => props.contractTemplate,
    set: (val) => emit('update:contractTemplate', val)
  })

  const localTermsAndConditions = computed({
    get: () => props.termsAndConditions,
    set: (val) => emit('update:termsAndConditions', val)
  })

  return {
    availableVariables,
    copiedTag,
    copyTag,
    activeTab,
    localContractTemplate,
    localTermsAndConditions,
    FileText,
    Variable,
    Copy,
    Check
  }
}
