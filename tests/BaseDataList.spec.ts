import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseDataList from '../app/components/ui/BaseDataList.vue'

describe('BaseDataList.vue', () => {
  it('renderiza com a prop columns e items no modo tabela', () => {
    const wrapper = mount(BaseDataList, {
      props: {
        type: 'table',
        columns: [
          { key: 'name', label: 'Nome' },
          { key: 'email', label: 'E-mail' }
        ],
        items: [
          { _id: '1', name: 'Bruno Trinchão', email: 'bruno@email.com' },
          { _id: '2', name: 'Tatiana Farias', email: 'tati@email.com' }
        ]
      }
    })

    expect(wrapper.text()).toContain('Nome')
    expect(wrapper.text()).toContain('E-mail')
    expect(wrapper.text()).toContain('Bruno Trinchão')
    expect(wrapper.text()).toContain('bruno@email.com')
    expect(wrapper.text()).toContain('Tatiana Farias')
  })

  it('suporta customização de células via slot #cell-{key}', () => {
    const wrapper = mount(BaseDataList, {
      props: {
        type: 'table',
        columns: [{ key: 'status', label: 'Status' }],
        items: [{ _id: '1', status: 'active' }]
      },
      slots: {
        'cell-status': '<span class="badge-active">Ativo</span>'
      }
    })

    expect(wrapper.find('.badge-active').exists()).toBe(true)
    expect(wrapper.text()).toContain('Ativo')
  })

  it('exibe estado de carregamento inicial (pending)', () => {
    const wrapper = mount(BaseDataList, {
      props: {
        type: 'table',
        pending: true,
        items: [],
        skeletonCount: 3
      }
    })

    // Deve exibir elementos skeleton de carregamento
    expect(wrapper.html()).toContain('skeleton-shimmer')
  })

  it('exibe a mensagem de lista vazia quando pending é falso e items está vazio', () => {
    const wrapper = mount(BaseDataList, {
      props: {
        type: 'table',
        pending: false,
        items: [],
        emptyTitle: 'Sem Clientes Encontrados',
        emptySubtitle: 'Cadastre o primeiro cliente para começar.'
      }
    })

    expect(wrapper.text()).toContain('Sem Clientes Encontrados')
    expect(wrapper.text()).toContain('Cadastre o primeiro cliente para começar.')
  })

  it('renderiza corretamente no modo grid', () => {
    const wrapper = mount(BaseDataList, {
      props: {
        type: 'grid',
        items: [{ _id: '1', title: 'Item em Grade' }]
      },
      slots: {
        item: '<template #item="{ item }"><div class="grid-card">{{ item.title }}</div></template>'
      }
    })

    expect(wrapper.find('.grid-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Item em Grade')
  })
})
