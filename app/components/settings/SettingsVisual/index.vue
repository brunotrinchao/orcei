<script setup lang="ts">
import { useSettingsVisual } from './index'

const props = defineProps<{
  logoUrl: string
  primaryColor: string
  isSaving?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:logoUrl', val: string): void
  (e: 'update:primaryColor', val: string): void
  (e: 'save'): void
}>()

const {
  localLogoUrl,
  localPrimaryColor,
  presetColors,
  selectPresetColor,
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
  Sparkles,
  Check,
  Eye
} = useSettingsVisual(props, emit)
</script>

<template>
  <BaseCard title="Identidade Visual">
    <!-- Cortador de Imagem (Cropper) -->
    <div v-if="showCropper" class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h4 class="text-sm font-black uppercase text-gray-900 dark:text-gray-100 tracking-wider">Ajuste e Recorte do Logotipo</h4>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Arraste e redimensione a área de seleção (Proporção 1:1)</p>
        </div>
      </div>
      <div class="bg-gray-900/90 rounded-2xl overflow-hidden p-4 shadow-inner">
        <Cropper
          ref="cropperRef"
          :src="rawImage"
          :stencil-props="{ aspectRatio: 1 / 1, movable: true, resizable: true }"
          class="w-full h-[280px] sm:h-[360px]"
        />
      </div>
      <div class="flex items-center justify-end gap-3 pt-2">
        <BaseButton type="button" variant="ghost" size="sm" @click="resetCropper()">
          Cancelar
        </BaseButton>
        <BaseButton type="button" variant="primary" size="sm" :disabled="isSaving" :loading="isSaving" @click="cropLogo">
          Confirmar Recorte
        </BaseButton>
      </div>
    </div>

    <!-- Conteúdo Principal de Configurações Visuais -->
    <div v-else class="space-y-8">
      
      <!-- Bloco 1: Logotipo da Marca -->
      <div class="bg-slate-50/70 dark:bg-gray-900/40 rounded-2xl border border-slate-200/80 dark:border-gray-800 p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-gray-800">
          <div>
            <h3 class="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">Logotipo da Marca</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Exibido no cabeçalho das propostas, PDFs e relatórios do Orcei</p>
          </div>

          <div class="flex items-center gap-2">
            <label class="cursor-pointer">
              <span class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow cursor-pointer">
                <Upload class="w-3.5 h-3.5" />
                {{ localLogoUrl ? 'Substituir Imagem' : 'Enviar Logotipo' }}
              </span>
              <input type="file" accept="image/*" @change="onFileChange" class="hidden">
            </label>

            <button
              v-if="localLogoUrl"
              type="button"
              @click="removeLogo"
              class="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
              title="Remover logotipo"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex flex-col md:flex-row items-center gap-6">
          <!-- Preview Box do Logo -->
          <div class="relative group shrink-0">
            <div class="w-36 h-36 bg-white dark:bg-gray-950 rounded-2xl border-2 border-slate-200 dark:border-gray-800 shadow-md flex items-center justify-center p-3 overflow-hidden transition-all group-hover:border-blue-500">
              <img
                v-if="localLogoUrl"
                :src="localLogoUrl"
                class="w-full h-full object-contain"
                alt="Logo da Marca"
                loading="lazy"
              >
              <div v-else class="text-gray-300 dark:text-gray-700 flex flex-col items-center gap-2 text-center">
                <PhotoIcon class="w-10 h-10 stroke-1" />
                <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Sem Logo</span>
              </div>
            </div>

            <label class="absolute -bottom-2 -right-2 w-9 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg transition-transform hover:scale-110">
              <Pencil class="w-4 h-4" />
              <input type="file" accept="image/*" @change="onFileChange" class="hidden">
            </label>
          </div>

          <!-- Informações de Formato -->
          <div class="space-y-3 text-center md:text-left flex-1">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 rounded-lg text-[11px] font-bold">
              <Sparkles class="w-3.5 h-3.5" />
              Tamanho recomendado: 120 × 120 px
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Formatos aceitos: <strong>PNG, JPG ou SVG</strong> (máx. 5MB). Utilize imagens com fundo transparente para melhor adaptação nos documentos.
            </p>
          </div>
        </div>
      </div>

      <!-- Bloco 2: Cor Primária da Marca + Live Preview -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Seleção de Cores -->
        <div class="bg-slate-50/70 dark:bg-gray-900/40 rounded-2xl border border-slate-200/80 dark:border-gray-800 p-6 space-y-5">
          <div>
            <h3 class="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">Cor Primária da Marca</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Define o tom visual dos botões, destaques e orçamentos</p>
          </div>

          <!-- Paleta de Cores Pré-definidas -->
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Cores Recomendadas</label>
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                v-for="color in presetColors"
                :key="color.hex"
                type="button"
                @click="selectPresetColor(color.hex)"
                class="relative h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2"
                :class="localPrimaryColor?.toLowerCase() === color.hex.toLowerCase() ? 'border-gray-900 dark:border-white scale-105 shadow-sm' : 'border-transparent opacity-85 hover:opacity-100'"
                :style="{ backgroundColor: color.hex }"
                :title="color.label"
              >
                <Check v-if="localPrimaryColor?.toLowerCase() === color.hex.toLowerCase()" class="w-4 h-4 text-white drop-shadow" />
              </button>
            </div>
          </div>

          <!-- Input Customizado de Cor -->
          <div class="pt-2">
            <BaseColorInput v-model="localPrimaryColor" label="Seletor de Cor Personalizada" />
          </div>
        </div>

        <!-- Live Preview do Orçamento -->
        <div class="bg-slate-50/70 dark:bg-gray-900/40 rounded-2xl border border-slate-200/80 dark:border-gray-800 p-6 space-y-4 flex flex-col justify-between">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Eye class="w-4 h-4 text-gray-400" />
              <h3 class="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">Pré-visualização do Cabeçalho</h3>
            </div>
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-200/60 dark:bg-gray-800 px-2 py-0.5 rounded">Exemplo</span>
          </div>

          <!-- Miniatura do Cartão de Orçamento -->
          <div class="bg-white dark:bg-gray-950 rounded-xl border border-slate-200 dark:border-gray-800 p-4 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center overflow-hidden">
                  <img v-if="localLogoUrl" :src="localLogoUrl" class="w-full h-full object-contain" alt="Logo">
                  <PhotoIcon v-else class="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <div class="text-xs font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">Sua Empresa Ltda</div>
                  <div class="text-[10px] text-gray-400">Orçamento #2026-001</div>
                </div>
              </div>

              <!-- Badge com Cor Primária -->
              <span
                class="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-white shadow-sm"
                :style="{ backgroundColor: localPrimaryColor || '#3147F6' }"
              >
                Aprovado
              </span>
            </div>

            <!-- Botão de Ação no Preview -->
            <div class="flex items-center justify-between pt-1">
              <span class="text-xs text-gray-500 font-medium">Valor Total: <strong class="text-gray-900 dark:text-gray-100">R$ 2.450,00</strong></span>
              <button
                type="button"
                class="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity"
                :style="{ backgroundColor: localPrimaryColor || '#3147F6' }"
              >
                Aceitar Proposta
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Bloco 3: Tema e Aparência -->
      <div class="bg-slate-50/70 dark:bg-gray-900/40 rounded-2xl border border-slate-200/80 dark:border-gray-800 p-6 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-xl bg-slate-200/70 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-200">
            <ClientOnly>
              <Moon v-if="isDark" class="w-5 h-5 text-blue-400" />
              <Sun v-else class="w-5 h-5 text-amber-500" />
            </ClientOnly>
          </div>
          <div>
            <h3 class="text-sm font-black uppercase tracking-wider text-gray-900 dark:text-gray-100">Modo da Interface</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              <ClientOnly>
                {{ isDark ? 'Modo Escuro (Dark Mode) ativado' : 'Modo Claro (Light Mode) ativado' }}
              </ClientOnly>
            </p>
          </div>
        </div>

        <button
          @click="toggle()"
          :class="[
            'relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer',
            isDark ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
          ]"
          :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
        >
          <span
            :class="[
              'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center',
              isDark ? 'translate-x-8' : 'translate-x-1'
            ]"
          >
            <ClientOnly>
              <Moon v-if="isDark" class="w-3 h-3 text-blue-600" />
              <Sun v-else class="w-3 h-3 text-amber-500" />
            </ClientOnly>
          </span>
        </button>
      </div>
    </div>

    <!-- Botão de Salvar no Rodapé -->
    <template #footer>
      <div class="flex justify-end">
        <BaseButton
          type="button"
          size="md"
          variant="primary"
          :disabled="isSaving"
          :loading="isSaving"
          @click="emit('save')"
        >
          {{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
        </BaseButton>
      </div>
    </template>
  </BaseCard>
</template>

<style scoped src="./index.css"></style>
