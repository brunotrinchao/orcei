import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseTextarea from '../app/components/ui/BaseTextarea.vue'

describe('BaseTextarea', () => {
  it('renderiza com valor e emite update:modelValue ao digitar', async () => {
    const wrapper = await mountSuspended(BaseTextarea, {
      props: { modelValue: 'Texto inicial' }
    })
    const textarea = wrapper.find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Texto inicial')

    await textarea.setValue('Novo texto')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['Novo texto'])
  })

  it('renderiza label quando fornecida', async () => {
    const wrapper = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', label: 'Descrição' }
    })
    expect(wrapper.find('label').text()).toContain('Descrição')
  })

  it('aplica background default (white) e customizados', async () => {
    const wrapperDefault = await mountSuspended(BaseTextarea, {
      props: { modelValue: '' }
    })
    expect(wrapperDefault.find('textarea').classes()).toContain('bg-white')

    const wrapperBlue = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', background: 'blue' }
    })
    expect(wrapperBlue.find('textarea').classes()).toContain('bg-blue-50')
  })

  it('aplica tamanho size xs, md, lg', async () => {
    const wrapperDefault = await mountSuspended(BaseTextarea, {
      props: { modelValue: '' }
    })
    expect(wrapperDefault.find('textarea').classes()).toContain('p-3.5')

    const wrapperXs = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', size: 'xs' }
    })
    expect(wrapperXs.find('textarea').classes()).toContain('p-2')

    const wrapperLg = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', size: 'lg' }
    })
    expect(wrapperLg.find('textarea').classes()).toContain('p-4')
  })

  it('aplica propriedades de borda (border)', async () => {
    const wrapperDefault = await mountSuspended(BaseTextarea, {
      props: { modelValue: '' }
    })
    expect(wrapperDefault.find('textarea').classes()).toContain('border-2')

    const wrapperNone = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', border: 'none' }
    })
    expect(wrapperNone.find('textarea').classes()).toContain('border-0')

    const wrapperViolet = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', border: 'violet' }
    })
    expect(wrapperViolet.find('textarea').classes()).toContain('border-violet-300')
  })
})
