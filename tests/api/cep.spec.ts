import { describe, it, expect, vi } from 'vitest'

describe('GET /api/cep/[cep]', () => {
  it('valida que CEP deve ter 8 dígitos', async () => {
    const handler = (await import('../../server/api/cep/[cep].get')).default

    const event: any = {
      context: {
        params: { cep: '123' }
      }
    }

    await expect(handler(event)).rejects.toThrow('CEP inválido')
  })

  it('retorna dados formatados para um CEP válido', async () => {
    const handler = (await import('../../server/api/cep/[cep].get')).default

    const event: any = {
      context: {
        params: { cep: '01001-000' }
      }
    }

    const mockFetch = vi.fn().mockResolvedValue({
      logradouro: 'Praça da Sé',
      bairro: 'Sé',
      localidade: 'São Paulo',
      uf: 'SP',
      complemento: 'lado ímpar'
    })
    vi.stubGlobal('$fetch', mockFetch)

    const res = await handler(event)

    expect(mockFetch).toHaveBeenCalledWith('https://viacep.com.br/ws/01001000/json/')
    expect(res).toEqual({
      zip: '01001000',
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP',
      complement: 'lado ímpar'
    })

    vi.unstubAllGlobals()
  })
})
