const TRUTHY = new Set(['true', '1', 'sim', 'yes'])

function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  return TRUTHY.has(String(value ?? '').trim().toLowerCase())
}

function str(value: any): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? undefined : trimmed
}

export function coerceClientRow(row: Record<string, any>): Record<string, any> {
  const address = ['street', 'number', 'neighborhood', 'city', 'state', 'zip']
    .some((key) => str(row[key]) !== undefined)
    ? {
        street: str(row.street),
        number: str(row.number),
        neighborhood: str(row.neighborhood),
        city: str(row.city),
        state: str(row.state),
        zip: str(row.zip)
      }
    : undefined

  return {
    name: str(row.name),
    email: str(row.email),
    phone: str(row.phone),
    isWhatsapp: toBoolean(row.isWhatsapp),
    taxId: str(row.taxId),
    notes: str(row.notes),
    ...(address ? { address } : {})
  }
}

export function coerceCatalogRow(row: Record<string, any>): Record<string, any> {
  return {
    type: str(row.type)?.toLowerCase(),
    name: str(row.name),
    description: str(row.description),
    price: Number(String(row.price ?? '').trim().replace(',', '.')),
    unit: str(row.unit) ?? 'UN',
    sku: str(row.sku)
  }
}

