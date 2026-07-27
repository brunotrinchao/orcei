<script setup lang="ts">
import { ref, computed } from 'vue'
import { SwatchBook, Image as PhotoIcon, Pencil, Sun, Moon } from 'lucide-vue-next'

const props = defineProps<{
  logoUrl: string
  primaryColor: string
}>()

const emit = defineEmits<{
  (e: 'update:logoUrl', val: string): void
  (e: 'update:primaryColor', val: string): void
}>()

const { notify } = useAlerts()
const isSaving = ref(false)
const { Cropper, showCropper, rawImage, cropperRef, onFileChange, resetCropper } = useCropper()
const { isDark, toggle } = useDarkMode()

const localLogoUrl = computed({
  get: () => props.logoUrl,
  set: (val) => emit('update:logoUrl', val)
})

const localPrimaryColor = computed({
  get: () => props.primaryColor,
  set: (val) => emit('update:primaryColor', val)
})

async function cropLogo() {
  if (!cropperRef.value) return
  const { canvas } = cropperRef.value.getResult()
  if (!canvas) return

  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = 120
  finalCanvas.height = 120
  const ctx = finalCanvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 120, 120)
  ctx.drawImage(canvas, 0, 0, 120, 120)

  isSaving.value = true
  try {
    const data = await $fetch<any>('/api/upload/cloudinary', {
      method: 'POST',
      body: { image: finalCanvas.toDataURL('image/png'), folder: 'orcei/logos' }
    })
    localLogoUrl.value = data.url
    resetCropper()
    notify('Sucesso', 'Logotipo atualizado!')
  } catch {
    notify('Erro', 'Não foi possível fazer upload da imagem.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseSectionCard id="visual" data-tour="config-visual" title="Identidade Visual" :icon="SwatchBook" icon-bg-class="bg-blue-50 dark:bg-blue-950/50" icon-color-class="text-blue-600 dark:text-blue-400">

    <!-- Cropper inline -->
    <div v-if="showCropper" class="space-y-6">
      <p class="text-sm text-gray-500 dark:text-gray-400 font-bold">Arraste e redimensione para o enquadramento ideal (1:1)</p>
      <div class="bg-gray-100 dark:bg-gray-800 rounded-3xl overflow-hidden">
        <Cropper
          ref="cropperRef"
          :src="rawImage"
          :stencil-props="{ aspectRatio: 1/1, movable: true, resizable: true }"
          class="w-full h-[280px] sm:h-[360px]"
        />
      </div>
      <div class="flex justify-end gap-3">
        <BaseButton
          type="button"
          variant="ghost"
          size="sm"
          @click="resetCropper()"
        >
          Cancelar
        </BaseButton>
        <BaseButton type="button" :disabled="isSaving" :loading="isSaving" @click="cropLogo">Confirmar Corte</BaseButton>
      </div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div class="md:col-span-2 flex flex-col md:flex-row items-center gap-10 p-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-[0.5rem] border border-gray-200 dark:border-gray-700">
        <div class="relative group">
          <div class="w-32 h-32 bg-white dark:bg-gray-900 rounded-[0.5rem] border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 duration-300 ring-1 ring-gray-100 dark:ring-gray-800">
            <img v-if="localLogoUrl" :src="localLogoUrl" class="w-full h-full object-contain" alt="Logo da Marca" loading="lazy">
            <div v-else class="text-gray-300 dark:text-gray-600 flex flex-col items-center gap-2">
              <PhotoIcon class="w-10 h-10 opacity-30" />
              <span class="text-[8px] font-black uppercase tracking-widest">120×120px</span>
            </div>
          </div>
          <label class="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-xl hover:bg-blue-700 transition-all hover:rotate-12 border-4 border-white dark:border-gray-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
            <Pencil class="w-5 h-5" />
            <input type="file" accept="image/*" @change="onFileChange" class="hidden">
          </label>
        </div>
        <div class="flex-1 text-center md:text-left">
          <h3 class="text-lg font-black text-gray-900 dark:text-gray-50 mb-1 uppercase tracking-tight">Logotipo da Marca</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 font-medium">Recomendado 120×120px. Aparece em todos os orçamentos.</p>
        </div>
      </div>

      <!-- Dark Mode -->
      <div class="md:col-span-2 flex items-center justify-between p-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-[0.5rem] border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-[0.5rem] bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
            <ClientOnly>
              <Moon v-if="isDark" class="w-4 h-4 transition-transform duration-300 hover:rotate-12" />
              <Sun v-else class="w-4 h-4 transition-transform duration-300 hover:rotate-12" />
            </ClientOnly>
          </div>
          <div>
            <h3 class="text-sm font-black text-gray-900 dark:text-gray-50 uppercase tracking-tight">Aparência</h3>
            <p class="text-xs text-gray-400 dark:text-gray-500 font-medium">
              <ClientOnly>
                {{ isDark ? 'Modo escuro ativo' : 'Modo claro ativo' }}
              </ClientOnly>
            </p>
          </div>
        </div>
        <button
          @click="toggle()"
          :class="[
            'relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
            isDark ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
          ]"
          :aria-label="isDark ? 'Ativar modo claro' : 'Ativar modo escuro'"
        >
          <span
            :class="[
              'inline-block h-5 w-5 transform rounded-full bg-white dark:bg-gray-900 shadow-md transition-transform duration-200 flex items-center justify-center',
              isDark ? 'translate-x-8' : 'translate-x-1'
            ]"
          >
            <ClientOnly>
              <Moon v-if="isDark" class="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <Sun v-else class="w-3 h-3 text-amber-500" />
            </ClientOnly>
          </span>
        </button>
      </div>

      <BaseColorInput
        v-model="localPrimaryColor"
        label="Cor Primária"
      />
    </div>
  </BaseSectionCard>
</template>
