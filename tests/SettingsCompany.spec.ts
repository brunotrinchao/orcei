import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { useSettingsCompany } from '../app/components/settings/SettingsCompany/index'

describe('useSettingsCompany', () => {
  it('retorna localCompany com valores padrão e ícone', () => {
    const company = ref({
      taxId: '00000000000000',
      legalName: 'Empresa Teste LTDA',
      tradeName: 'Empresa Teste',
      titleCard: 'Meu Perfil'
    })

    let updatedCompany: any = null
    const emit = (_e: string, val: any) => {
      updatedCompany = val
    }

    const { localCompany, isSearchingCnpj, Building2 } = useSettingsCompany({ company: company.value }, emit)

    expect(localCompany.value.legalName).toBe('Empresa Teste LTDA')
    expect(localCompany.value.titleCard).toBe('Meu Perfil')
    expect(isSearchingCnpj.value).toBe(false)
    expect(Building2).toBeDefined()
  })
})
