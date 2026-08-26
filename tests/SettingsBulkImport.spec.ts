import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SettingsBulkImport from '../app/components/settings/SettingsBulkImport/index.vue'

describe('SettingsBulkImport', () => {
  it('renderiza cards de Clientes e Catálogo com link de modelo CSV', async () => {
    const wrapper = await mountSuspended(SettingsBulkImport)
    const links = wrapper.findAll('a')
    const hrefs = links.map(l => l.attributes('href'))

    expect(wrapper.text()).toContain('Clientes')
    expect(wrapper.text()).toContain('Catálogo')
    expect(hrefs).toContain('/templates/modelo-clientes.csv')
    expect(hrefs).toContain('/templates/modelo-catalogo.csv')
  })

  it('abre o modal com type="client" ao clicar em Processar no card de Clientes', async () => {
    const wrapper = await mountSuspended(SettingsBulkImport)
    const buttons = wrapper.findAll('button').filter(b => b.text().includes('Processar'))
    await buttons[0]!.trigger('click')

    const modal = wrapper.findComponent({ name: 'BulkImportModal' })
    expect(modal.props('open')).toBe(true)
    expect(modal.props('type')).toBe('client')
  })
})
