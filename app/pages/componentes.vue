<script setup lang="ts">
import { ref } from 'vue'
import {
  Search,
  Sparkles,
  Plus,
  Trash2,
  Mail,
  Pencil,
  Eye,
  Check,
  Calendar,
  DollarSign,
  User,
  Settings,
  AlertCircle,
  Filter,
  Clock,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Building,
  MoreVertical,
  Download,
  History,
  FileText,
  AlertTriangle
} from 'lucide-vue-next'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem
} from 'radix-vue'
import type { BaseTableColumn } from '~/components/ui/BaseTable.vue'

definePageMeta({
  title: 'Catálogo de Componentes UI',
  layout: 'blank'
})

// Estados para componentes interativos
const activeTab = ref('buttons')
const inputText = ref('')
const inputSearch = ref('')
const inputError = ref('')
const textareaText = ref('Exemplo de observação cadastrada no sistema.')
const checkboxValue = ref(true)
const colorValue = ref('#3147F6')
const selectValue = ref('opcao1')
const comboboxValue = ref('sp')
const iconSelectValue = ref('User')

// Estado para Dialogs
const isDialogOpen = ref(false)
const isAlertDialogOpen = ref(false)

// Estado para DataList / BaseTable
const currentPage = ref(1)
const tableColumns: BaseTableColumn[] = [
  { key: 'code', label: 'REF' },
  { key: 'title', label: 'Item / Titulo' },
  { key: 'category', label: 'Categoria' },
  { key: 'status', label: 'Status', type: 'badge', align: 'center' },
  { key: 'price', label: 'Valor (Moeda)', type: 'currency', align: 'right' }
]

const tableItems = ref([
  { id: '1', code: '#ORC-001', title: 'Desenvolvimento Web Nuxt 3', category: 'Serviços', status: 'Ativo', price: 4500.00 },
  { id: '2', code: '#ORC-002', title: 'Design System & UI Kit', category: 'Design', status: 'Pendente', price: 2800.50 },
  { id: '3', code: '#ORC-003', title: 'Consultoria Cloud & DevOps', category: 'Infraestrutura', status: 'Concluído', price: 6200.00 },
  { id: '4', code: '#ORC-004', title: 'Integração de Gateway de Pagamento', category: 'Backend', status: 'Ativo', price: 1950.00 }
])

const selectOptions = [
  { label: 'Opção 1 - Padrão', value: 'opcao1' },
  { label: 'Opção 2 - Avançado', value: 'opcao2' },
  { label: 'Opção 3 - Empresarial', value: 'opcao3' }
]

const comboboxItems = [
  { label: 'São Paulo', value: 'sp' },
  { label: 'Rio de Janeiro', value: 'rj' },
  { label: 'Minas Gerais', value: 'mg' },
  { label: 'Bahia', value: 'ba' }
]

const navSections = [
  { id: 'buttons', label: 'BaseButton' },
  { id: 'badges', label: 'BaseBadge' },
  { id: 'cards', label: 'BaseCard' },
  { id: 'inputs', label: 'Inputs & Form' },
  { id: 'selects', label: 'Seleção & Combobox' },
  { id: 'metrics', label: 'Métricas & Progresso' },
  { id: 'table', label: 'DataList & Table' },
  { id: 'dialogs', label: 'Modais & Alertas' },
  { id: 'skeletons', label: 'Skeletons & Extras' }
]

function scrollToSection(id: string) {
  activeTab.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-8 space-y-8">
    <!-- Header / Banner de Dev -->
    <div class="max-w-7xl mx-auto space-y-4">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl text-white shadow-xl">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold tracking-wider uppercase backdrop-blur-md">
            <Sparkles class="w-3.5 h-3.5 text-amber-300" />
            🧪 Guia de Componentes UI (Ambiente de Testes)
          </div>
          <h1 class="text-2xl sm:text-3xl font-black tracking-tight">Catálogo Interno de Componentes UI</h1>
          <p class="text-blue-100 text-xs sm:text-sm max-w-2xl font-medium">
            Esta página reúne todos os componentes base e suas variações visuais/responsivas. Esta página é temporária e destinada apenas para testes.
          </p>
        </div>
      </div>

      <!-- Navegação por Seções (Pills Sticky) -->
      <div class="sticky top-4 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-slate-200 dark:border-gray-800 rounded-2xl p-2 shadow-lg overflow-x-auto custom-scrollbar flex items-center gap-2">
        <button
          v-for="nav in navSections"
          :key="nav.id"
          @click="scrollToSection(nav.id)"
          class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
          :class="activeTab === nav.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-800'"
        >
          {{ nav.label }}
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto space-y-12">
      <!-- ─── 1. BASEBUTTON ─────────────────────────────────────────── -->
      <section id="buttons" class="space-y-6">
        <BaseSectionCard title="BaseButton" subtitle="Variações de botões, tamanhos, estados responsivos e ícones.">
          <div class="space-y-8">
            <!-- Variantes de Cores -->
            <div class="space-y-3">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">1. Variantes de Cor (`variant`)</h4>
              <div class="flex flex-wrap gap-3 items-center">
                <BaseButton variant="primary">Primary</BaseButton>
                <BaseButton variant="secondary">Secondary</BaseButton>
                <BaseButton variant="solid">Solid</BaseButton>
                <BaseButton variant="outline">Outline</BaseButton>
                <BaseButton variant="ghost">Ghost</BaseButton>
                <BaseButton variant="danger">Danger</BaseButton>
                <BaseButton variant="ia">
                  <Sparkles class="w-4 h-4 mr-2" />
                  Gerar com IA
                </BaseButton>
                <BaseButton variant="whatsapp">WhatsApp</BaseButton>
              </div>
            </div>

            <!-- Tamanhos -->
            <div class="space-y-3">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">2. Tamanhos (`size`)</h4>
              <div class="flex flex-wrap gap-3 items-center">
                <BaseButton size="xs">Extra Small (xs)</BaseButton>
                <BaseButton size="sm">Small (sm)</BaseButton>
                <BaseButton size="md">Medium (md - Padrão)</BaseButton>
                <BaseButton size="lg">Large (lg)</BaseButton>
              </div>
            </div>

            <!-- Ícones e Icon Only -->
            <div class="space-y-3">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">4. Botões com Ícones (`icon-sm`, `icon`, `iconOnly`)</h4>
              <div class="flex flex-wrap gap-3 items-center">
                <BaseButton size="icon-sm" tooltip="Editar registro">
                  <Pencil class="w-4 h-4" />
                </BaseButton>
                <BaseButton size="icon" tooltip="Visualizar detalhes">
                  <Eye class="w-4 h-4" />
                </BaseButton>
                <BaseButton variant="danger" size="icon" tooltip="Excluir">
                  <Trash2 class="w-4 h-4" />
                </BaseButton>
                <BaseButton variant="secondary" size="icon" tooltip="Configurações">
                  <Settings class="w-4 h-4" />
                </BaseButton>
              </div>
            </div>

            <!-- Estados Especializados -->
            <div class="space-y-3">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">5. Estados (Loading, Disabled, Link)</h4>
              <div class="flex flex-wrap gap-3 items-center">
                <BaseButton :loading="true">Carregando...</BaseButton>
                <BaseButton :disabled="true">Desabilitado</BaseButton>
                <BaseButton type="link" href="https://google.com" target="_blank">
                  Link Externo (a)
                </BaseButton>
                <BaseButton tooltip="Este botão possui tooltip customizado!">Com Tooltip</BaseButton>
              </div>
            </div>
          </div>
        </BaseSectionCard>
      </section>

      <!-- ─── 2. BASEBADGE ─────────────────────────────────────────── -->
      <section id="badges" class="space-y-6">
        <BaseSectionCard title="BaseBadge" subtitle="Etiquetas de status e categorias.">
          <div class="space-y-4">
            <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">1. Variantes Preenchidas (Filled)</h4>
            <div class="flex flex-wrap gap-3 items-center">
              <BaseBadge variant="default">Default / Rascunho</BaseBadge>
              <BaseBadge variant="success">Success / Aprovado</BaseBadge>
              <BaseBadge variant="warning">Warning / Pendente</BaseBadge>
              <BaseBadge variant="error">Error / Recusado</BaseBadge>
              <BaseBadge variant="info">Info / Em Processamento</BaseBadge>
              <BaseBadge variant="ia">
                <Sparkles class="w-3 h-3 mr-1" />
                IA Ativa
              </BaseBadge>
              <BaseBadge variant="price">R$ 1.500,00</BaseBadge>
            </div>

            <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest pt-4">2. Variantes Contornadas (`outline`)</h4>
            <div class="flex flex-wrap gap-3 items-center">
              <BaseBadge variant="default" outline>Default</BaseBadge>
              <BaseBadge variant="success" outline>Success</BaseBadge>
              <BaseBadge variant="warning" outline>Warning</BaseBadge>
              <BaseBadge variant="error" outline>Error</BaseBadge>
              <BaseBadge variant="info" outline>Info</BaseBadge>
              <BaseBadge variant="ia" outline>
                <Sparkles class="w-3 h-3 mr-1" />
                IA Outline
              </BaseBadge>
            </div>

            <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest pt-4">3. Variantes Suaves com Alto Contraste (`light`)</h4>
            <div class="flex flex-wrap gap-3 items-center">
              <BaseBadge variant="default" light>Default Light</BaseBadge>
              <BaseBadge variant="success" light>Success Light</BaseBadge>
              <BaseBadge variant="warning" light>Warning Light</BaseBadge>
              <BaseBadge variant="error" light>Error Light</BaseBadge>
              <BaseBadge variant="info" light>Info Light</BaseBadge>
              <BaseBadge variant="ia" light>
                <Sparkles class="w-3 h-3 mr-1" />
                IA Light
              </BaseBadge>
            </div>

            <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest pt-4">4. Tamanhos e Bordas Arredondadas (`size` & `rounded`)</h4>
            <div class="flex flex-wrap gap-3 items-center">
              <BaseBadge size="xs" rounded="full" variant="success">Extra Small Full</BaseBadge>
              <BaseBadge size="sm" rounded="md" variant="info">Small Medium (Padrão)</BaseBadge>
              <BaseBadge size="md" rounded="lg" variant="warning">Medium Large Rounded</BaseBadge>
              <BaseBadge size="lg" rounded="full" variant="ia">Large Pill Badge</BaseBadge>
            </div>
          </div>
        </BaseSectionCard>
      </section>

      <!-- ─── BASECARD ─────────────────────────────────────────────── -->
      <section id="cards" class="space-y-6">
        <BaseSectionCard title="BaseCard" subtitle="Card multiuso com slots para header, content e footer separados por bordas divisórias.">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Card Padrão com Header e Footer -->
            <BaseCard title="Card Padrão" subtitle="Subtítulo opcional" color="blue">
              <p class="text-xs text-slate-600 dark:text-gray-300">
                Este é o conteúdo principal do card (slot default). O header e o footer estão separados por uma linha de borda de um lado ao outro.
              </p>

              <template #footer>
                <span class="text-xs font-bold text-slate-500">Status: Ativo</span>
                <BaseButton size="sm" variant="primary">Ação do Footer</BaseButton>
              </template>
            </BaseCard>

            <!-- Card com Destaque de Cor Emerald -->
            <BaseCard title="Card de Sucesso / Emerald" color="emerald">
              <p class="text-xs text-slate-600 dark:text-gray-300">
                Card com acento de cor superior (emerald) e slots customizados.
              </p>

              <template #footer>
                <span class="text-xs font-bold text-emerald-600">Total: R$ 4.500,00</span>
                <BaseButton size="sm" variant="outline">Ver Detalhes</BaseButton>
              </template>
            </BaseCard>
          </div>
        </BaseSectionCard>
      </section>

      <!-- ─── 3. INPUTS & FORMULÁRIOS ───────────────────────────────── -->
      <section id="inputs" class="space-y-6">
        <BaseSectionCard title="Inputs & Formulários" subtitle="Campos de entrada de texto, textarea, checkbox e cor.">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- BaseInput -->
            <div class="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">BaseInput</h4>
              
              <BaseInput
                v-model="inputText"
                label="Nome Completo"
                placeholder="Digite seu nome..."
                :icon="User"
                required
              />

              <BaseInput
                v-model="inputSearch"
                label="Pesquisa com Ícone"
                placeholder="Buscar orçamento por cliente..."
                :icon="Search"
              />

              <BaseInput
                type="password"
                label="Senha"
                placeholder="••••••••"
              />

              <BaseInput
                v-model="inputError"
                label="Campo com Erro"
                placeholder="Preencha incorretamente..."
                error="E-mail inválido ou já cadastrado."
              />

              <BaseInput
                label="Campo Desabilitado"
                model-value="Valor bloqueado"
                disabled
              />
            </div>

            <!-- BaseTextarea, BaseCheckbox, BaseColorInput -->
            <div class="space-y-6 p-4 rounded-2xl bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">Textarea, Checkbox & Color</h4>

              <BaseTextarea
                v-model="textareaText"
                label="Observações do Orçamento"
                placeholder="Digite detalhes adicionais..."
                :rows="3"
                :maxlength="200"
              />

              <div class="space-y-3 pt-2">
                <h5 class="text-xs font-bold text-slate-500 uppercase">BaseCheckbox</h5>
                <div class="flex items-center gap-6">
                  <BaseCheckbox v-model="checkboxValue" label="Aceito os termos" />
                  <BaseCheckbox :model-value="false" label="Não marcado" />
                  <BaseCheckbox :model-value="true" disabled label="Desabilitado" />
                </div>
              </div>

              <div class="space-y-3 pt-2">
                <h5 class="text-xs font-bold text-slate-500 uppercase">BaseColorInput</h5>
                <BaseColorInput v-model="colorValue" label="Cor Principal da Marca" />
              </div>
            </div>
          </div>
        </BaseSectionCard>
      </section>

      <!-- ─── 4. SELEÇÃO & COMBOBOX ─────────────────────────────────── -->
      <section id="selects" class="space-y-6">
        <BaseSectionCard title="Seleção & Combobox" subtitle="Selects customizados com Radix, busca autocomplete e icon picker.">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- BaseSelect -->
            <div class="space-y-4">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">BaseSelect</h4>
              <BaseSelect
                v-model="selectValue"
                label="Plano Escolhido"
                :options="selectOptions"
                :icon="CreditCard"
              />

              <BaseSelect
                v-model="selectValue"
                label="Tamanho Pequeno (sm)"
                size="sm"
                :options="selectOptions"
              />
            </div>

            <!-- BaseCombobox -->
            <div class="space-y-4">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">BaseCombobox (Autocompletar)</h4>
              <BaseCombobox
                v-model="comboboxValue"
                label="Estado / UF"
                placeholder="Selecione um estado..."
                :options="comboboxItems"
              />
            </div>

            <!-- BaseIconSelect -->
            <div class="space-y-4">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">BaseIconSelect (Ícone)</h4>
              <BaseIconSelect
                v-model="iconSelectValue"
                label="Ícone da Categoria"
              />
            </div>
          </div>
        </BaseSectionCard>
      </section>

      <!-- ─── 5. MÉTRICAS & PROGRESSO ──────────────────────────────── -->
      <section id="metrics" class="space-y-6">
        <BaseSectionCard title="Métricas & Progresso" subtitle="Cards de KPI e barras de progresso operacionais.">
          <!-- BaseMetricCard Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BaseMetricCard
              title="Faturamento Total"
              value="R$ 124.500,00"
              subtitle="+15% em relação ao mês anterior"
              color="emerald"
              :icon="TrendingUp"
              badge="+15%"
            />

            <BaseMetricCard
              title="Orçamentos Enviados"
              value="48"
              subtitle="12 aguardando resposta"
              color="blue"
              :icon="Mail"
              badge="Mês Atual"
            />

            <BaseMetricCard
              title="Taxa de Conversão"
              value="68.4%"
              subtitle="Meta: 70%"
              color="purple"
              :icon="Check"
              badge="Alta Performance"
            />

            <BaseMetricCard
              title="Créditos IA Restantes"
              value="120"
              subtitle="Renova em 15 dias"
              color="amber"
              :icon="Sparkles"
              badge="Créditos"
            />
          </div>

          <!-- BaseProgressBar -->
          <div class="p-6 bg-slate-50 dark:bg-gray-900 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-6 mt-6">
            <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">BaseProgressBar</h4>
            
            <BaseProgressBar
              :value="75"
              :max="100"
              label="Progresso da Meta Mensal"
              show-label
              color="bg-blue-600"
            />

            <BaseProgressBar
              :value="90"
              :max="100"
              label="Uso de Armazenamento"
              show-label
              color="bg-purple-600"
            />

            <BaseProgressBar
              indeterminate
              label="Processando Importação em Lote..."
              show-label
              color="bg-emerald-500"
            />
          </div>
        </BaseSectionCard>
      </section>

      <!-- ─── 6. BASEDATALIST & BASETABLE ───────────────────────────── -->
      <section id="table" class="space-y-6">
        <BaseSectionCard title="BaseDataList & BaseTable" subtitle="Componente declarativo unificado para tabelas e cards em mobile.">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">
                Tabela Declarativa com tipos `currency` (fonte mono) e `badge` (sem label no mobile)
              </h4>
            </div>

            <BaseDataList
              :columns="tableColumns"
              :items="tableItems"
              :total="tableItems.length"
              :items-per-page="10"
              :current-page="currentPage"
              @update:current-page="cp => currentPage = cp"
            >
              <!-- Slot customizado para coluna 'status' -->
              <template #cell-status="{ item }">
                <BaseBadge :variant="item.status === 'Concluído' ? 'success' : item.status === 'Ativo' ? 'info' : 'warning'">
                  {{ item.status }}
                </BaseBadge>
              </template>
            </BaseDataList>
          </div>
        </BaseSectionCard>
      </section>

      <!-- ─── 7. DIÁLOGOS & MODAIS ─────────────────────────────────── -->
      <section id="dialogs" class="space-y-6">
        <BaseSectionCard title="Modais & Alertas" subtitle="BaseDialog (com close à esquerda e menu de contexto à direita) e BaseAlertDialog.">
          <div class="flex flex-wrap gap-4 items-center">
            <BaseButton variant="primary" @click="isDialogOpen = true">
              Abrir BaseDialog (Modal Completo)
            </BaseButton>

            <BaseButton variant="danger" @click="isAlertDialogOpen = true">
              Abrir BaseAlertDialog (Confirmação)
            </BaseButton>
          </div>

          <!-- BaseDialog Demo -->
          <BaseDialog
            v-model:open="isDialogOpen"
            title="Exemplo de Modal de Detalhes"
            size="lg"
          >
            <template #context-menu>
              <DropdownMenuRoot>
                <DropdownMenuTrigger as-child>
                  <button
                    type="button"
                    class="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[0.75rem] transition-all cursor-pointer"
                    title="Mais ações"
                  >
                    <MoreVertical class="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuContent
                    align="end"
                    :side-offset="6"
                    class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-[9999]"
                  >
                    <DropdownMenuItem class="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer">
                      <Download class="w-4 h-4 text-blue-500" />
                      Baixar Relatório PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem class="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 cursor-pointer">
                      <History class="w-4 h-4 text-purple-500" />
                      Ver Histórico
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenuPortal>
              </DropdownMenuRoot>
            </template>

            <div class="space-y-4 py-2">
              <div class="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 text-blue-900 dark:text-blue-200">
                <h5 class="text-sm font-bold">Conteúdo Interno do Modal</h5>
                <p class="text-xs mt-1 text-blue-700 dark:text-blue-300">
                  O botão de fechar (X) está posicionado no canto superior esquerdo e o menu de contexto (...) à direita.
                </p>
              </div>
            </div>

            <template #footer>
              <div class="flex justify-end gap-3 w-full">
                <BaseButton variant="secondary" @click="isDialogOpen = false">Cancelar</BaseButton>
                <BaseButton variant="primary" @click="isDialogOpen = false">Confirmar Ação</BaseButton>
              </div>
            </template>
          </BaseDialog>

          <!-- BaseAlertDialog Demo -->
          <BaseAlertDialog
            v-model:open="isAlertDialogOpen"
            title="Excluir Registro Permanente?"
            description="Esta ação não poderá ser desfeita. Todos os dados associados serão removidos do servidor."
            confirm-text="Sim, Excluir"
            cancel-text="Cancelar"
            variant="danger"
            @confirm="isAlertDialogOpen = false"
          />
        </BaseSectionCard>
      </section>

      <!-- ─── 8. SKELETONS & FEEDBACKS ─────────────────────────────── -->
      <section id="skeletons" class="space-y-6">
        <BaseSectionCard title="Skeletons & Feedbacks" subtitle="Placeholders de carregamento visual para dados em trânsito.">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 space-y-4">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">BaseSkeleton (Linhas e Avatar)</h4>
              
              <div class="flex items-center gap-4">
                <BaseSkeleton width="3rem" height="3rem" borderRadius="1rem" />
                <div class="space-y-2 flex-1">
                  <BaseSkeleton width="60%" height="1.25rem" />
                  <BaseSkeleton width="40%" height="0.75rem" />
                </div>
              </div>

              <div class="space-y-2 pt-4 border-t border-slate-100 dark:border-gray-800">
                <BaseSkeleton width="100%" height="1rem" />
                <BaseSkeleton width="90%" height="1rem" />
                <BaseSkeleton width="75%" height="1rem" />
              </div>
            </div>

            <div class="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 space-y-4">
              <h4 class="text-xs font-black uppercase text-slate-400 tracking-widest">BasePagination</h4>
              <div class="py-4 flex justify-center">
                <BasePagination
                  :current-page="currentPage"
                  :total-items="40"
                  :items-per-page="10"
                  @update:current-page="p => currentPage = p"
                />
              </div>
            </div>
          </div>
        </BaseSectionCard>
      </section>
    </div>
  </div>
</template>
