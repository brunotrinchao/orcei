import { ref, provide, inject, reactive, onUnmounted } from 'vue'
import type { Ref } from 'vue'

const REGISTRY_KEY = 'formValidationRegistry'
const SUBMIT_KEY = 'formValidationSubmitAttempted'

export interface FieldEntry {
  isEmpty: () => boolean
  focus: () => void
}

/**
 * Componente universal de validação de campos obrigatórios.
 *
 * Chamado uma vez por formulário/wizard, no componente pai (ex: dentro do
 * <script setup> de um modal de cadastro). Cria um contexto de validação que
 * os campos Base* (BaseInput, BaseTextarea, BaseSelect, BaseCheckbox) com
 * `required` descobrem sozinhos via provide/inject — nenhum campo precisa
 * ser listado manualmente pelo formulário.
 *
 * Cada campo mostra seu próprio estado de erro (borda vermelha + "Campo
 * obrigatório" abaixo, sem deslocar o layout) somente depois da primeira
 * tentativa de envio (submitAttempted).
 *
 * Uso típico:
 *   const { validate, reset } = useFormValidation()
 *   async function onSubmit() {
 *     if (!validate()) return
 *     ...
 *   }
 *   watch(isOpen, (open) => { if (!open) reset() }) // limpa erros ao fechar o modal
 */
export function useFormValidation() {
  const fields = reactive(new Map<string, FieldEntry>())
  const submitAttempted = ref(false)

  provide(REGISTRY_KEY, fields)
  provide(SUBMIT_KEY, submitAttempted)

  /** Retorna true se tudo ok. Se houver campo obrigatório vazio, foca nele e retorna false. */
  function validate(): boolean {
    submitAttempted.value = true
    const invalid = Array.from(fields.values()).filter((f) => f.isEmpty())
    if (invalid.length > 0) {
      invalid[0].focus()
      return false
    }
    return true
  }

  /** Limpa o estado de "tentou enviar" — usar ao fechar/reabrir o formulário. */
  function reset() {
    submitAttempted.value = false
  }

  return { validate, reset, submitAttempted }
}

let anonymousFieldId = 0

/**
 * Uso interno dos componentes Base* — registra o campo no formulário pai mais
 * próximo (se houver `useFormValidation()` em algum ancestral) e retorna
 * `submitAttempted` pra saber quando passar a exibir o próprio erro.
 * Fora de um formulário com useFormValidation(), vira no-op (submitAttempted
 * sempre false, nada é registrado).
 */
export function useFieldValidation(opts: { isEmpty: () => boolean; focus: () => void }) {
  const registry = inject<Map<string, FieldEntry> | null>(REGISTRY_KEY, null)
  const submitAttempted = inject<Ref<boolean>>(SUBMIT_KEY, ref(false))

  if (registry) {
    const id = `field-${++anonymousFieldId}`
    registry.set(id, opts)
    onUnmounted(() => registry.delete(id))
  }

  return { submitAttempted }
}
