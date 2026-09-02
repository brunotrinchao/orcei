/**
 * Overlay Stack global — fonte de verdade do z-index de modais/drawers/alerts.
 *
 * Problema resolvido: contadores separados por componente (dialogs vs drawers)
 * geravam z-index iguais → backdrop de um overlay novo podia ficar atrás do
 * painel antigo. Agora TODOS compartilham o mesmo contador: cada overlay aberto
 * empilha deterministicamente, e o backdrop seguinte cobre o conteúdo anterior.
 */
const activeOverlaysCount = ref(0)

export function useOverlayStack() {
  /** Incrementa e retorna o nível deste overlay (usado no z-index) */
  function register(): number {
    activeOverlaysCount.value++
    return activeOverlaysCount.value
  }

  /** Decrementa após a animação de saída (300ms) */
  function unregister() {
    setTimeout(() => {
      activeOverlaysCount.value = Math.max(0, activeOverlaysCount.value - 1)
    }, 300)
  }

  return {
    register,
    unregister,
    activeOverlaysCount
  }
}

/** Z do overlay/backdrop p/ um nível dado */
export function overlayZ(level: number, base = 100): number {
  return base + level * 2
}

/** Z do conteúdo (painel) p/ um nível dado */
export function contentZ(level: number, base = 100): number {
  return base + level * 2 + 1
}