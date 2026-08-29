import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseProgressBar from '../app/components/ui/BaseProgressBar.vue'

describe('BaseProgressBar.vue', () => {
  it('renderiza o progresso correto com base em value e max', () => {
    const wrapper = mount(BaseProgressBar, {
      props: {
        value: 93.18,
        max: 100
      }
    })

    const innerBar = wrapper.find('.rounded-full.h-full')
    expect(innerBar.exists()).toBe(true)
    expect(innerBar.attributes('style')).toContain('width: 93.18%')
  })

  it('suporta cor customizada via hex (ex: #ccff00)', () => {
    const wrapper = mount(BaseProgressBar, {
      props: {
        value: 50,
        color: '#ccff00'
      }
    })

    const innerBar = wrapper.find('.rounded-full.h-full')
    expect(innerBar.attributes('style')).toContain('background-color: #ccff00')
    expect(innerBar.attributes('style')).toContain('width: 50%')
  })

  it('suporta classe de cor Tailwind (ex: bg-blue-600)', () => {
    const wrapper = mount(BaseProgressBar, {
      props: {
        value: 75,
        color: 'bg-blue-600'
      }
    })

    const innerBar = wrapper.find('.rounded-full.h-full')
    expect(innerBar.classes()).toContain('bg-blue-600')
    expect(innerBar.attributes('style')).toContain('width: 75%')
  })

  it('suporta aliases em português (valor, maximo, cor, altura, exibirRotulo)', () => {
    const wrapper = mount(BaseProgressBar, {
      props: {
        valor: 40,
        maximo: 200,
        cor: 'lime',
        altura: 'h-3',
        exibirRotulo: true,
        rotulo: 'Progresso da Meta'
      }
    })

    expect(wrapper.text()).toContain('Progresso da Meta')
    expect(wrapper.text()).toContain('20%')
    const innerBar = wrapper.find('.rounded-full.h-full')
    expect(innerBar.attributes('style')).toContain('width: 20%')
  })
})
