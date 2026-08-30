import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseBadge from '../app/components/ui/BaseBadge.vue'

describe('BaseBadge Component', () => {
  it('renderiza o slot de conteúdo corretamente', async () => {
    const wrapper = await mountSuspended(BaseBadge, {
      slots: {
        default: () => 'Aprovado'
      }
    })
    expect(wrapper.text()).toContain('Aprovado')
  })

  it('aplica variante preenchida (filled) por padrão', async () => {
    const wrapper = await mountSuspended(BaseBadge, {
      props: { variant: 'success' }
    })
    expect(wrapper.classes()).toContain('bg-emerald-50')
  })

  it('aplica estilo outline quando a prop outline é verdadeira', async () => {
    const wrapper = await mountSuspended(BaseBadge, {
      props: { variant: 'success', outline: true }
    })
    expect(wrapper.classes()).toContain('bg-transparent')
    expect(wrapper.classes()).toContain('text-emerald-700')
  })

  it('aplica tamanhos xs, sm, md, lg corretamente', async () => {
    const wrapperXs = await mountSuspended(BaseBadge, {
      props: { size: 'xs' }
    })
    expect(wrapperXs.classes()).toContain('px-1.5')

    const wrapperLg = await mountSuspended(BaseBadge, {
      props: { size: 'lg' }
    })
    expect(wrapperLg.classes()).toContain('px-3.5')
  })

  it('aplica bordas arredondadas personalizadas (rounded)', async () => {
    const wrapperFull = await mountSuspended(BaseBadge, {
      props: { rounded: 'full' }
    })
    expect(wrapperFull.classes()).toContain('rounded-full')

    const wrapperNone = await mountSuspended(BaseBadge, {
      props: { rounded: 'none' }
    })
    expect(wrapperNone.classes()).toContain('rounded-none')
  })

  it('aplica variante suave de alto contraste quando a prop light é verdadeira', async () => {
    const wrapperLight = await mountSuspended(BaseBadge, {
      props: { variant: 'success', light: true }
    })
    expect(wrapperLight.classes()).toContain('bg-emerald-100')
    expect(wrapperLight.classes()).toContain('text-emerald-950')
  })
})
