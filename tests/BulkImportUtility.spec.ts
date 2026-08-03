import { coerceClientRow, coerceCatalogRow } from '../server/utils/bulkImport'

describe('coerceCatalogRow', () => {
  it('converte price string para number', () => {
    expect(coerceCatalogRow({ type: 'product', name: 'Item', price: '49.90' }).price).toBe(49.9)
  })

  it('mantém price inválido (não numérico) como NaN pra validação pegar depois', () => {
    expect(Number.isNaN(coerceCatalogRow({ type: 'product', name: 'Item', price: 'abc' }).price)).toBe(true)
  })

  it('default unit para "UN" quando ausente', () => {
    expect(coerceCatalogRow({ type: 'product', name: 'Item', price: '10' }).unit).toBe('UN')
  })

  it('mantém type, name, sku, description como strings com trim', () => {
    const result = coerceCatalogRow({ type: ' service ', name: ' Corte ', price: '10', sku: ' SKU-1 ', description: ' desc ' })
    expect(result.type).toBe('service')
    expect(result.name).toBe('Corte')
    expect(result.sku).toBe('SKU-1')
    expect(result.description).toBe('desc')
  })
})

describe('coerceClientRow', () => {
  it('converte isWhatsapp string "true"/"1" para boolean true', () => {
    expect(coerceClientRow({ isWhatsapp: 'true' }).isWhatsapp).toBe(true)
    expect(coerceClientRow({ isWhatsapp: '1' }).isWhatsapp).toBe(true)
  })

  it('converte isWhatsapp string "false"/"0"/vazio para boolean false', () => {
    expect(coerceClientRow({ isWhatsapp: 'false' }).isWhatsapp).toBe(false)
    expect(coerceClientRow({ isWhatsapp: '0' }).isWhatsapp).toBe(false)
    expect(coerceClientRow({ isWhatsapp: '' }).isWhatsapp).toBe(false)
    expect(coerceClientRow({}).isWhatsapp).toBe(false)
  })

  it('monta address a partir das colunas planas do CSV (street, number, neighborhood, city, state, zip)', () => {
    const result = coerceClientRow({
      name: 'João', email: 'joao@email.com',
      street: 'Rua A', number: '10', neighborhood: 'Centro', city: 'SP', state: 'SP', zip: '01000-000'
    })
    expect(result.address).toEqual({
      street: 'Rua A', number: '10', neighborhood: 'Centro', city: 'SP', state: 'SP', zip: '01000-000'
    })
  })

  it('não inclui address quando nenhuma coluna de endereço está presente', () => {
    const result = coerceClientRow({ name: 'João', email: 'joao@email.com' })
    expect(result.address).toBeUndefined()
  })

  it('mantém campos simples (name, email, phone, taxId, notes) como estão, com trim', () => {
    const result = coerceClientRow({ name: '  João  ', email: ' joao@email.com ', phone: '11999999999', taxId: '123', notes: 'obs' })
    expect(result.name).toBe('João')
    expect(result.email).toBe('joao@email.com')
    expect(result.phone).toBe('11999999999')
    expect(result.taxId).toBe('123')
    expect(result.notes).toBe('obs')
  })
})
