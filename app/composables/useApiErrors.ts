interface ApiFieldError {
  field: string
  message: string
}

/**
 * Extrai erros de campo de uma resposta 422 e retorna HTML <ul><li> para exibição no notify.
 * Retorna null se não houver erros estruturados.
 */
export function parseApiErrors(e: any): string | null {
  const errors: ApiFieldError[] | undefined = e?.data?.data?.errors
  if (!errors?.length) return null

  const items = errors.map(err => `<li>${err.message}</li>`).join('')
  return `<ul class="list-disc pl-5 space-y-1 mt-1">${items}</ul>`
}
