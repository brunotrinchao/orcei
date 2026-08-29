import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseMetricCard from '../app/components/ui/BaseMetricCard.vue'

describe('BaseMetricCard.vue', () => {
  it('renderiza título, subtítulo, badge e valor corretamente', () => {
    const wrapper = mount(BaseMetricCard, {
      props: {
        title: 'Faturamento',
        subtitle: '12 orçamentos convertidos',
        badge: 'Faturado',
        value: 'R$ 15.000',
        color: 'green'
      }
    })

    expect(wrapper.text()).toContain('Faturamento')
    expect(wrapper.text()).toContain('12 orçamentos convertidos')
    expect(wrapper.text()).toContain('Faturado')
    expect(wrapper.text()).toContain('R$ 15.000')
  })

  it('suporta aliases em português para titulo e subtitulo', () => {
    const wrapper = mount(BaseMetricCard, {
      props: {
        titulo: 'Conversão',
        subtitulo: '100% de taxa de aceite',
        badge: 'Sucesso',
        value: '85%',
        color: 'blue'
      }
    })

    expect(wrapper.text()).toContain('Conversão')
    expect(wrapper.text()).toContain('100% de taxa de aceite')
    expect(wrapper.text()).toContain('Sucesso')
    expect(wrapper.text()).toContain('85%')
  })

  it('renderiza o estado de skeleton quando loading é true', () => {
    const wrapper = mount(BaseMetricCard, {
      props: {
        loading: true,
        title: 'Faturamento',
        value: 'R$ 10.000'
      }
    })

    expect(wrapper.find('.skeleton-shimmer').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('R$ 10.000')
  })

  it('renderiza slot de footer quando fornecido', () => {
    const wrapper = mount(BaseMetricCard, {
      props: {
        title: 'Métrica com Footer',
        value: '100'
      },
      slots: {
        footer: '<div class="custom-footer">Footer Customizado</div>'
      }
    })

    expect(wrapper.find('.custom-footer').exists()).toBe(true)
    expect(wrapper.text()).toContain('Footer Customizado')
  })
})
