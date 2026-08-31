import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import BaseFilters from '../app/components/ui/BaseFilters.vue'

describe('BaseFilters Component', () => {
  it('renderiza o slot de busca e o botão Filtrar', async () => {
    const wrapper = await mountSuspended(BaseFilters, {
      slots: {
        search: () => h('input', { id: 'test-search-input', placeholder: 'Buscar...' })
      }
    })

    expect(wrapper.find('#test-search-input').exists()).toBe(true)
    expect(wrapper.text()).toContain('Filtrar')
  })

  it('exibe o badge com o contador de filtros ativos', async () => {
    const wrapper = await mountSuspended(BaseFilters, {
      props: {
        activeFiltersCount: 3
      },
      slots: {
        search: () => h('input', { placeholder: 'Buscar...' })
      }
    })

    expect(wrapper.text()).toContain('3')
  })

  it('emite o evento clear ao clicar no botão Limpar', async () => {
    const wrapper = await mountSuspended(BaseFilters, {
      props: {
        activeFiltersCount: 2
      },
      slots: {
        search: () => h('input', { placeholder: 'Buscar...' })
      }
    })

    const clearButton = wrapper.find('button[title="Limpar filtros"]')
    expect(clearButton.exists()).toBe(true)

    await clearButton.trigger('click')
    expect(wrapper.emitted('clear')).toBeTruthy()
  })

  it('configura o campo de busca no modal exclusivamente para mobile (md:hidden)', async () => {
    const wrapper = await mountSuspended(BaseFilters, {
      slots: {
        search: () => h('input', { id: 'mobile-modal-search', placeholder: 'Buscar no modal...' }),
        default: () => h('div', { id: 'test-filter-field' }, 'Filtro de Status')
      }
    })

    // Clica no botão Filtrar
    const filterBtn = wrapper.findAll('button').find(b => b.text().includes('Filtrar'))
    expect(filterBtn?.exists()).toBe(true)
    await filterBtn?.trigger('click')

    // Verifica que o modal foi acionado e renderiza o slot de busca e filtro no body (teleport do BaseDialog)
    expect(document.body.innerHTML).toContain('mobile-modal-search')
    expect(document.body.innerHTML).toContain('test-filter-field')
  })

  it('oculta o botão Filtrar no desktop se não houver filtros no slot default', async () => {
    const wrapperOnlySearch = await mountSuspended(BaseFilters, {
      slots: {
        search: () => h('input', { placeholder: 'Buscar...' })
      }
    })

    const btnOnlySearch = wrapperOnlySearch.findAll('button').find(b => b.text().includes('Filtrar'))
    expect(btnOnlySearch?.classes()).toContain('md:hidden')

    const wrapperWithFilters = await mountSuspended(BaseFilters, {
      slots: {
        search: () => h('input', { placeholder: 'Buscar...' }),
        default: () => h('div', 'Filtro Extra')
      }
    })

    const btnWithFilters = wrapperWithFilters.findAll('button').find(b => b.text().includes('Filtrar'))
    expect(btnWithFilters?.classes()).not.toContain('md:hidden')
  })
})
