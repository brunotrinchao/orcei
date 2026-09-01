import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseSelect from '../app/components/ui/BaseSelect.vue'

describe('BaseSelect', () => {
  const options = [
    { label: 'Opção 1', value: 'opt1' },
    { label: 'Opção 2', value: 'opt2' }
  ]

  it('renderiza com label e placeholder', async () => {
    const wrapper = await mountSuspended(BaseSelect, {
      props: { options, label: 'Categoria', placeholder: 'Selecione uma opção' }
    })
    expect(wrapper.find('label').text()).toContain('Categoria')
    expect(wrapper.text()).toContain('Selecione uma opção')
  })

  it('aplica background default e customizados', async () => {
    const wrapperDefault = await mountSuspended(BaseSelect, {
      props: { options }
    })
    expect(wrapperDefault.find('button').classes()).toContain('bg-white')

    const wrapperBlue = await mountSuspended(BaseSelect, {
      props: { options, background: 'blue' }
    })
    expect(wrapperBlue.find('button').classes()).toContain('bg-blue-50')
  })

  it('aplica tamanho size xs, md, lg', async () => {
    const wrapperDefault = await mountSuspended(BaseSelect, {
      props: { options }
    })
    expect(wrapperDefault.find('button').classes()).toContain('py-3.5')

    const wrapperXs = await mountSuspended(BaseSelect, {
      props: { options, size: 'xs' }
    })
    expect(wrapperXs.find('button').classes()).toContain('py-1.5')

    const wrapperLg = await mountSuspended(BaseSelect, {
      props: { options, size: 'lg' }
    })
    expect(wrapperLg.find('button').classes()).toContain('py-4')
  })

  it('aplica propriedades de borda (border)', async () => {
    const wrapperDefault = await mountSuspended(BaseSelect, {
      props: { options }
    })
    expect(wrapperDefault.find('button').classes()).toContain('border-line')

    const wrapperNone = await mountSuspended(BaseSelect, {
      props: { options, border: 'none' }
    })
    expect(wrapperNone.find('button').classes()).toContain('border-0')

    const wrapperViolet = await mountSuspended(BaseSelect, {
      props: { options, border: 'violet' }
    })
    expect(wrapperViolet.find('button').classes()).toContain('border-violet-300')
  })
})
