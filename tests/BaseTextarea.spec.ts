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
    expect(wrapperDefault.find('textarea').classes()).toContain('py-3.5')

    const wrapperXs = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', size: 'xs' }
    })
    expect(wrapperXs.find('textarea').classes()).toContain('py-1.5')

    const wrapperLg = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', size: 'lg' }
    })
    expect(wrapperLg.find('textarea').classes()).toContain('py-4')
  })

  it('aplica propriedades de borda (border) alinhadas 1:1 ao BaseInput', async () => {
    const wrapperDefault = await mountSuspended(BaseTextarea, {
      props: { modelValue: '' }
    })
    expect(wrapperDefault.find('textarea').classes()).toContain('border-line')
    expect(wrapperDefault.find('textarea').classes()).toContain('border')

    const wrapperNone = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', border: 'none' }
    })
    expect(wrapperNone.find('textarea').classes()).toContain('border-0')

    const wrapperViolet = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', border: 'violet' }
    })
    expect(wrapperViolet.find('textarea').classes()).toContain('border-violet-300')
  })

  it('aplica variante (variant) definindo tema de background e borda', async () => {
    const wrapperSlate = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', variant: 'slate' }
    })
    expect(wrapperSlate.find('textarea').classes()).toContain('bg-slate-100')
    expect(wrapperSlate.find('textarea').classes()).toContain('border-slate-300')
  })

  it('aplica cor customizada de texto (color)', async () => {
    const wrapperColor = await mountSuspended(BaseTextarea, {
      props: { modelValue: '', color: 'violet' }
    })
    expect(wrapperColor.find('textarea').classes()).toContain('!text-violet-600')
  })
})
