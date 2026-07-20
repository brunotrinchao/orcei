import { ref, defineAsyncComponent } from 'vue'

/**
 * Shared cropper setup — eliminates duplicate logic in CatalogItemFormDialog + SettingsVisual.
 * Applies: bundle-dynamic-imports (async component), DRY composable extraction.
 */
export function useCropper() {
  const Cropper = defineAsyncComponent(async () => {
    await import('vue-advanced-cropper/dist/style.css')
    const { Cropper } = await import('vue-advanced-cropper')
    return Cropper
  })

  const showCropper = ref(false)
  const rawImage = ref<string | null>(null)
  const cropperRef = ref<any>(null)

  function onFileChange(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      rawImage.value = e.target?.result as string
      showCropper.value = true
    }
    reader.readAsDataURL(file)
  }

  function resetCropper() {
    showCropper.value = false
    rawImage.value = null
  }

  return { Cropper, showCropper, rawImage, cropperRef, onFileChange, resetCropper }
}
