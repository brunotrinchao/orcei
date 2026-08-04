<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadCloud } from 'lucide-vue-next'
import {
  validateImportFile,
  parseCsvText,
  chunkRows,
  MAX_ROWS,
  BATCH_SIZE
} from '../../composables/useBulkImportParser'

const props = defineProps<{ open: boolean; type: 'client' | 'catalog' }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

type Step = 'idle' | 'preview' | 'processing' | 'done'
type RowResult = { index: number; status: 'created' | 'skipped' | 'error'; message?: string }

const step = ref<Step>('idle')
const fileError = ref<string | null>(null)
const rows = ref<Record<string, string>[]>([])
const processedCount = ref(0)
const results = ref<RowResult[]>([])

const endpoint = computed(() => props.type === 'client' ? '/api/clients/bulk' : '/api/catalog/bulk')
const title = computed(() => props.type === 'client' ? 'Importar Clientes' : 'Importar Catálogo')

const summary = computed(() => ({
  created: results.value.filter(r => r.status === 'created').length,
  skipped: results.value.filter(r => r.status === 'skipped').length,
  errors: results.value.filter(r => r.status === 'error').length
}))

function reset() {
  step.value = 'idle'
  fileError.value = null
  rows.value = []
  processedCount.value = 0
  results.value = []
}

function close() {
  emit('update:open', false)
  reset()
}

async function onFileChange(event: Event) {
  fileError.value = null
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const error = validateImportFile(file)
  if (error) {
    fileError.value = error
    return
  }

  const text = await file.text()
  const parsed = parseCsvText(text)

  if (parsed.length === 0) {
    fileError.value = 'CSV vazio ou sem linhas de dados'
    return
  }
  if (parsed.length > MAX_ROWS) {
    fileError.value = `Arquivo excede ${MAX_ROWS} linhas, divida em arquivos menores`
    return
  }

  rows.value = parsed
  step.value = 'preview'
}

async function processImport() {
  step.value = 'processing'
  processedCount.value = 0
  results.value = []

  const batches = chunkRows(rows.value, BATCH_SIZE)
  let offset = 0

  for (const batch of batches) {
    try {
      const response = await $fetch<{ results: RowResult[] }>(endpoint.value, {
        method: 'POST',
        body: { rows: batch }
      })
      results.value.push(...response.results.map(r => ({ ...r, index: r.index + offset })))
    } catch (e: any) {
      results.value.push(...batch.map((_, i) => ({
        index: i + offset,
        status: 'error' as const,
        message: e?.data?.statusMessage || 'Falha ao processar lote'
      })))
    }
    processedCount.value += batch.length
    offset += batch.length
  }

  step.value = 'done'
}
</script>

<template>
  <BaseDialog :open="open" @update:open="(v) => v ? emit('update:open', true) : close()" :title="title" size="xl">
    <div v-if="step === 'idle'" class="space-y-4">
      <label class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-[0.75rem] p-10 cursor-pointer">
        <UploadCloud class="w-8 h-8 text-gray-400" />
        <span class="text-sm font-bold text-gray-600 dark:text-gray-300">Clique para selecionar um arquivo CSV</span>
        <input type="file" accept=".csv" class="hidden" @change="onFileChange">
      </label>
      <p v-if="fileError" class="text-sm font-bold text-red-600">{{ fileError }}</p>
    </div>

    <div v-else-if="step === 'preview'" class="space-y-4">
      <p class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ rows.length }} registro(s) encontrado(s)</p>
      <div class="overflow-x-auto max-h-64 border border-gray-100 dark:border-gray-800 rounded-[0.75rem]">
        <table class="w-full text-sm  whitespace-nowrap">
          <thead>
            <tr>
              <th v-for="key in Object.keys(rows[0] || {})" :key="key" class="text-left px-3 py-2 font-black uppercase text-xs whitespace-nowrap">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i" class="border-t border-gray-100 dark:border-gray-800">
              <td v-for="key in Object.keys(row)" :key="key" class="px-3 py-2 whitespace-nowrap">{{ row[key] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="step === 'processing'" class="space-y-4 text-center py-10">
      <p class="text-lg font-black">Processando {{ processedCount }} de {{ rows.length }}</p>
    </div>

    <div v-else-if="step === 'done'" class="space-y-4">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div><p class="text-2xl font-black">{{ summary.created }}</p><p class="text-xs uppercase text-gray-500">Criados</p></div>
        <div><p class="text-2xl font-black">{{ summary.skipped }}</p><p class="text-xs uppercase text-gray-500">Ignorados</p></div>
        <div><p class="text-2xl font-black">{{ summary.errors }}</p><p class="text-xs uppercase text-gray-500">Erros</p></div>
      </div>
      <ul v-if="summary.errors > 0 || summary.skipped > 0" class="text-sm space-y-1 max-h-48 overflow-y-auto">
        <li v-for="r in results.filter(r => r.status !== 'created')" :key="r.index" :class="r.status === 'error' ? 'text-red-600' : 'text-yellow-600'">
          Linha {{ r.index + 1 }}: {{ r.message }}
        </li>
      </ul>
    </div>

    <template #footer>
      <BaseButton v-if="step === 'preview'" type="button" @click="processImport">Processar</BaseButton>
      <BaseButton v-if="step === 'done'" type="button" @click="close">Concluir</BaseButton>
    </template>
  </BaseDialog>
</template>
