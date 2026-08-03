import { describe, it, expect } from 'vitest'
import { coerceClientRow } from '../server/utils/bulkImport'

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
