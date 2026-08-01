export interface ValidationError {
  field: string
  message: string
}

export function throwIfInvalid(errors: ValidationError[]) {
  if (errors.length === 0) return
  throw createError({
    statusCode: 422,
    statusMessage: 'Dados inválidos',
    data: { errors }
  })
}

export function validateClient(body: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body.name?.trim()) errors.push({ field: 'name', message: 'Nome é obrigatório' })

  // Cadastro rápido/lead: só exige nome + pelo menos um contato (e-mail OU telefone/WhatsApp).
  const hasEmail = !!body.email?.trim()
  const hasPhone = !!body.phone?.trim()
  if (!hasEmail && !hasPhone) {
    errors.push({ field: 'email', message: 'Informe ao menos um contato: e-mail ou telefone/WhatsApp' })
  }
  if (hasEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email.trim())) {
      errors.push({ field: 'email', message: 'E-mail informado é inválido' })
    }
  }

  // Endereço completo é opcional no primeiro momento — só exige os campos se o
  // usuário já começou a preencher algum deles (evita salvar endereço pela metade).
  const addr = body.address
  const addressStarted = !!(addr && (addr.zip?.trim() || addr.street?.trim() || addr.neighborhood?.trim() || addr.city?.trim() || addr.state?.trim()))
  if (addressStarted) {
    if (!addr.zip?.trim())          errors.push({ field: 'address.zip',          message: 'CEP é obrigatório' })
    if (!addr.street?.trim())       errors.push({ field: 'address.street',       message: 'Rua é obrigatória' })
    if (!addr.neighborhood?.trim()) errors.push({ field: 'address.neighborhood', message: 'Bairro é obrigatório' })
    if (!addr.city?.trim())         errors.push({ field: 'address.city',         message: 'Cidade é obrigatória' })
    if (!addr.state?.trim())        errors.push({ field: 'address.state',        message: 'Estado é obrigatório' })
  }

  return errors
}

export function validateCatalogItem(body: any): ValidationError[] {
  const errors: ValidationError[] = []

  if (!body.type || !['product', 'service'].includes(body.type)) {
    errors.push({ field: 'type', message: 'Tipo deve ser "product" ou "service"' })
  }
  if (!body.name?.trim()) errors.push({ field: 'name', message: 'Nome é obrigatório' })
  if (body.price != null && body.price < 0) {
    errors.push({ field: 'price', message: 'Preço não pode ser negativo' })
  }

  return errors
}
