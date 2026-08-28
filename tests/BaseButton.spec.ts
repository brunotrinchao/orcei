import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseButton from '../app/components/ui/BaseButton.vue'

describe('BaseButton Component', () => {
  it('renderiza corretamente com o texto do slot', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      slots: {
        default: () => 'Salvar Alterações'
      }
    })

    expect(wrapper.text()).toContain('Salvar Alterações')
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('aplica classes de variantes corretamente (primary, danger, ia, whatsapp)', async () => {
    const wrapperPrimary = await mountSuspended(BaseButton, {
      props: { variant: 'primary' }
    })
    expect(wrapperPrimary.classes()).toContain('bg-[#3147F6]')

    const wrapperDanger = await mountSuspended(BaseButton, {
      props: { variant: 'danger' }
    })
    expect(wrapperDanger.classes()).toContain('bg-red-500')

    const wrapperIa = await mountSuspended(BaseButton, {
      props: { variant: 'ia' }
    })
    expect(wrapperIa.classes()).toContain('from-violet-600')
  })

  it('exibe spinner de loading e desabilita o botão quando loading é true', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      props: { loading: true }
    })

    expect(wrapper.attributes('disabled')).toBeDefined()
    expect(wrapper.find('.animate-spin').exists()).toBe(true)
  })

  it('suporta renderização de tooltip quando a prop tooltip é informada', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      props: {
        tooltip: 'Dica explicativa do botão',
        tooltipSide: 'top'
      },
      slots: {
        default: () => 'Ação com Tooltip'
      }
    })

    expect(wrapper.find('button').attributes('title')).toBe('Dica explicativa do botão')
    expect(wrapper.find('button').attributes('aria-label')).toBe('Dica explicativa do botão')
    expect(wrapper.text()).toContain('Ação com Tooltip')
  })

  it('dispara evento de click no botão interno mesmo quando tooltip é informado', async () => {
    let clicked = false
    const wrapper = await mountSuspended(BaseButton, {
      props: {
        tooltip: 'Consumir 1 crédito'
      },
      attrs: {
        onClick: () => {
          clicked = true
        }
      },
      slots: {
        default: () => 'Usar IA'
      }
    })

    await wrapper.find('button').trigger('click')
    expect(clicked).toBe(true)
  })
})
