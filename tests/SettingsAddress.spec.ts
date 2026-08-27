import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import { useSettingsAddress } from '../app/components/settings/SettingsAddress/index'

describe('useSettingsAddress', () => {
  it('busca CEP no ViaCEP e atualiza rua, bairro, cidade e estado', async () => {
    const address = ref({
      zip: '01001-000',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: ''
    })

    const mockFetch = vi.fn().mockResolvedValue({
      street: 'Praça da Sé',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP'
    })
    vi.stubGlobal('$fetch', mockFetch)

    let updatedAddress: any = null
    const emit = (_e: string, val: any) => {
      updatedAddress = val
    }

    const { handleCepInput } = useSettingsAddress({ address: address.value }, emit)

    await handleCepInput()

    expect(mockFetch).toHaveBeenCalledWith('/api/cep/01001000')
    expect(updatedAddress).toEqual({
      zip: '01001-000',
      street: 'Praça da Sé',
      number: '',
      neighborhood: 'Sé',
      city: 'São Paulo',
      state: 'SP'
    })

    vi.unstubAllGlobals()
  })
})
