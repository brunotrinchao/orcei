<script setup lang="ts">
import { useSettingsVisual } from './index'

const props = defineProps<{
  logoUrl: string
  primaryColor?: string
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:logoUrl', val: string): void
  (e: 'save'): void
}>()

const {
  localLogoUrl,
  removeLogo,
  isSaving,
  Cropper,
  showCropper,
  rawImage,
  cropperRef,
  onFileChange,
  resetCropper,
  isDark,
  toggle,
  cropLogo,
  PhotoIcon,
  Pencil,
  Sun,
  Moon,
  Trash2,
  Upload,
  Sparkles
} = useSettingsVisual(props, emit)
</script>

<template>
  <BaseCard title="Identidade Visual">
    <!-- Cortador de Imagem (Cropper) -->
    <div v-if="showCropper" class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-mmedium text-gray-900 dark:text-gray-100 tracking-wider">Ajuste e Recorte do Logotipo
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-base">Arraste e redimensione a área de seleção
            (Proporção 1:1)</p>
        </div>
      </div>
      <div class="bg-gray-900/90 rounded-[.5rem] overflow-hidden p-4 shadow-inner">
        <Cropper ref="cropperRef" :src="rawImage"
          :stencil-props="{ aspectRatio: 1 / 1, movable: true, resizable: true }"
          class="w-full h-[280px] sm:h-[360px]" />
      </div>
      <div class="flex items-center justify-end gap-3 pt-2">
        <BaseButton type="button" variant="ghost" size="sm" @click="resetCropper()">
          Cancelar
        </BaseButton>
        <BaseButton type="button" variant="primary" size="sm" :disabled="isSaving" :loading="isSaving"
          @click="cropLogo">
          Confirmar Recorte
        </BaseButton>
      </div>
    </div>

    <!-- Conteúdo Principal de Configurações Visuais -->
    <div v-else class="space-y-8">

      <!-- Logotipo da Marca -->
      <BaseCard compact color="slate">
        <template #header>
          <div
            class="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-gray-800">
            <div>
              <h3 class="text-sm font-semibold tracking-wide text-gray-900 dark:text-gray-100">Logotipo da Marca</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-base mt-0.5">Exibido no cabeçalho das propostas,
                PDFs e relatórios do Orcei</p>
            </div>

            <div class="flex items-center gap-2">
              <label class="cursor-pointer">
                <BaseButton size="sm" type="button">
                  <Upload class="w-3.5 h-3.5 mr-1" />
                  {{ localLogoUrl ? 'Substituir Imagem' : 'Enviar Logotipo' }}
                </BaseButton>
                <input type="file" accept="image/*" @change="onFileChange" class="hidden">
              </label>

              <BaseButton variant="danger" size="sm" v-if="localLogoUrl" type="button" @click="removeLogo">
                <Trash2 class="w-4 h-4" />
              </BaseButton>
            </div>
          </div>
        </template>

        <div class="flex flex-col md:flex-row items-center gap-6">
          <!-- Preview Box do Logo -->
          <div class="relative group shrink-0">
            <div
              class="w-36 h-36 bg-white dark:bg-gray-950 rounded-[.5rem] border border-slate-200 dark:border-gray-800 flex items-center justify-center p-3 overflow-hidden transition-all group-hover:border-blue-500">
              <img v-if="localLogoUrl" :src="localLogoUrl" class="w-full h-full object-contain" alt="Logo da Marca"
                loading="lazy">
              <div v-else class="text-gray-300 dark:text-gray-700 flex flex-col items-center gap-2 text-center">
                <PhotoIcon class="w-10 h-10 stroke-1" />
                <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Sem
                  Logo</span>
              </div>
            </div>

            <label
              class="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-[.5rem] flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110">
              <Pencil class="w-4 h-4" />
              <input type="file" accept="image/*" @change="onFileChange" class="hidden">
            </label>
          </div>

          <!-- Informações de Formato -->
          <div class="space-y-3 text-center md:text-left flex-1">
            <div
              class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-[.5rem] text-[11px] font-bold">
              <Sparkles class="w-3.5 h-3.5" />
              Tamanho recomendado: 120 × 120 px
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Formatos aceitos: <strong>PNG, JPG ou SVG</strong> (máx. 5MB). Utilize imagens com fundo transparente para
              melhor
              adaptação nos documentos.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Tema e Aparência -->
      <BaseCard compact color="slate">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div
              class="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
              <ClientOnly>
                <Moon v-if="isDark" class="w-5 h-5 text-blue-400" />
                <Sun v-else class="w-5 h-5 text-amber-500" />
              </ClientOnly>
            </div>
            <div>
              <h3 class="text-sm font-medium tracking-wide text-gray-900 dark:text-gray-100">Modo da Interface
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 font-base mt-0.5">
                <ClientOnly>
                  {{ isDark ? 'Modo Escuro (Dark Mode) ativado' : 'Modo Claro (Light Mode) ativado' }}
                </ClientOnly>
              </p>
            </div>
          </div>

          <button @click="toggle()" :class="[
            'relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer',
            isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
          ]" :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'">
            <span :class="[
              'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center',
              isDark ? 'translate-x-8' : 'translate-x-1'
            ]">
              <ClientOnly>
                <Moon v-if="isDark" class="w-3 h-3 text-blue-600" />
                <Sun v-else class="w-3 h-3 text-amber-500" />
              </ClientOnly>
            </span>
          </button>
        </div>
      </BaseCard>
    </div>

    <!-- Botão de Salvar no Rodapé -->
    <template #footer>
      <div class="flex justify-end">
        <BaseButton v-if="!showCropper" type="button" size="md" variant="primary" :disabled="isSaving"
          :loading="isSaving" @click="emit('save')">
          {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
        </BaseButton>
      </div>
    </template>
  </BaseCard>
</template>

<style scoped src="./index.css"></style>
