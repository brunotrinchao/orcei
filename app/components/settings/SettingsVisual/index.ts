import { ref, computed } from 'vue'
import { SwatchBook, Image as PhotoIcon, Pencil, Sun, Moon } from 'lucide-vue-next'

export function useSettingsVisual(
  props: { logoUrl: string; primaryColor: string },
  emit: { (e: 'update:logoUrl', val: string): void; (e: 'update:primaryColor', val: string): void }
) {
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

  return {
    localLogoUrl,
    localPrimaryColor,
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
    SwatchBook,
    PhotoIcon,
    Pencil,
    Sun,
    Moon
  }
}
