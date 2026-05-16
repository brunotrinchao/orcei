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
  if (!body.email?.trim()) errors.push({ field: 'email', message: 'E-mail é obrigatório' })
  if (!body.phone?.trim()) errors.push({ field: 'phone', message: 'Telefone é obrigatório' })

  const addr = body.address
  if (!addr?.zip?.trim())          errors.push({ field: 'address.zip',          message: 'CEP é obrigatório' })
  if (!addr?.street?.trim())       errors.push({ field: 'address.street',       message: 'Rua é obrigatória' })
  if (!addr?.neighborhood?.trim()) errors.push({ field: 'address.neighborhood', message: 'Bairro é obrigatório' })
  if (!addr?.city?.trim())         errors.push({ field: 'address.city',         message: 'Cidade é obrigatória' })
  if (!addr?.state?.trim())        errors.push({ field: 'address.state',        message: 'Estado é obrigatório' })

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
