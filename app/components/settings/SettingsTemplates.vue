<script setup lang="ts">
import { ref, computed } from 'vue'
import { FileText, Variable, Copy, Check } from 'lucide-vue-next'
import { useClipboard } from '@vueuse/core'

const { copy, copied } = useClipboard()

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

const props = defineProps<{
  contractTemplate: string
  termsAndConditions: string
}>()

const emit = defineEmits<{
  (e: 'update:contractTemplate', val: string): void
  (e: 'update:termsAndConditions', val: string): void
}>()

const activeTab = ref<'contract' | 'terms'>('contract')

const localContractTemplate = computed({
  get: () => props.contractTemplate,
  set: (val) => emit('update:contractTemplate', val)
})

const localTermsAndConditions = computed({
  get: () => props.termsAndConditions,
  set: (val) => emit('update:termsAndConditions', val)
})
</script>

<template>
  <section id="modelos" class="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 shadow-sm scroll-mt-8">
    <div class="flex items-center gap-3 mb-6">
      <div class="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
        <FileText class="w-5 h-5 text-purple-600 dark:text-purple-400" />
      </div>
      <h2 class="text-xl font-black text-gray-900 dark:text-gray-50 uppercase tracking-tight">Modelos Legais</h2>
    </div>

    <div class="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-8 max-w-sm">
      <button
        type="button"
        data-tour="config-modelo-contrato"
        @click="activeTab = 'contract'"
        :class="activeTab === 'contract' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
        class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        Contrato
      </button>
      <button
        type="button"
        data-tour="config-modelo-termos"
        @click="activeTab = 'terms'"
        :class="activeTab === 'terms' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 shadow-md' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
        class="flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        Termos
      </button>
    </div>

    <!-- Lista de Variáveis Dinâmicas -->
    <div class="mb-8 p-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800">
      <div class="flex items-center gap-2 mb-4">
        <Variable class="w-4 h-4 text-slate-500 dark:text-slate-400" />
        <h3 class="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Variáveis Dinâmicas</h3>
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mb-4">
        Clique em uma variável para copiá-la e use-a no seu texto. Ela será substituída automaticamente na geração do orçamento ou contrato.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="v in availableVariables"
          :key="v.tag"
          @click="copyTag(v.tag)"
          class="group flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-900 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 rounded-lg transition-all"
          :title="v.desc"
        >
          <span class="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 group-hover:text-violet-700 dark:group-hover:text-violet-400">{{ v.tag }}</span>
          <Check v-if="copiedTag === v.tag" class="w-3 h-3 text-emerald-500" />
          <Copy v-else class="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-violet-400" />
        </button>
      </div>
    </div>

    <div v-show="activeTab === 'contract'" class="space-y-4">
      <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Contrato Padrão</label>
      <LazyRichTextEditor v-model="localContractTemplate" class="min-h-[350px] border-2 border-gray-50 dark:border-gray-800 rounded-3xl overflow-hidden" />
    </div>
    <div v-show="activeTab === 'terms'" class="space-y-4">
      <label class="block text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest ml-1">Termos e Condições</label>
      <LazyRichTextEditor v-model="localTermsAndConditions" class="min-h-[350px] border-2 border-gray-50 dark:border-gray-800 rounded-3xl overflow-hidden" />
    </div>
  </section>
</template>
