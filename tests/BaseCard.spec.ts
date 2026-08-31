import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseCard from '../app/components/ui/BaseCard.vue'

describe('BaseCard Component', () => {
  it('renderiza o título e o conteúdo do slot principal', async () => {
    const wrapper = await mountSuspended(BaseCard, {
      props: {
        title: 'Card de Teste',
        subtitle: 'Subtítulo explicativo'
      },
      slots: {
        default: () => 'Conteúdo do corpo do card'
      }
    })

    expect(wrapper.text()).toContain('Card de Teste')
    expect(wrapper.text()).toContain('Subtítulo explicativo')
    expect(wrapper.text()).toContain('Conteúdo do corpo do card')
  })

  it('renderiza os slots de header e footer com linhas divisórias de um lado ao outro quando habilitadas', async () => {
    const wrapper = await mountSuspended(BaseCard, {
      props: {
        headerSeparator: true,
        footerSeparator: true
      },
      slots: {
        header: () => 'Cabeçalho Customizado',
        default: () => 'Corpo do Card',
        footer: () => 'Rodapé com Ações'
      }
    })

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('header').classes()).toContain('border-b')
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(wrapper.find('footer').classes()).toContain('border-t')
    expect(wrapper.text()).toContain('Cabeçalho Customizado')
    expect(wrapper.text()).toContain('Rodapé com Ações')
  })

  it('aplica a cor no fundo do card quando a prop color é fornecida', async () => {
    const wrapper = await mountSuspended(BaseCard, {
      props: { color: 'blue' }
    })
    expect(wrapper.classes()).toContain('bg-blue-50')
  })

  it('oculta as linhas divisórias por padrão (headerSeparator e footerSeparator false por padrão)', async () => {
    const wrapperNoSeparators = await mountSuspended(BaseCard, {
      props: {
        title: 'Sem Linhas Divisórias'
      },
      slots: {
        default: () => 'Corpo',
        footer: () => 'Rodapé'
      }
    })

    expect(wrapperNoSeparators.find('header').classes()).not.toContain('border-b')
    expect(wrapperNoSeparators.find('footer').classes()).not.toContain('border-t')
  })

  it('aplica padding reduzido quando a prop compact é verdadeira', async () => {
    const wrapperCompact = await mountSuspended(BaseCard, {
      props: {
        title: 'Card Compacto',
        compact: true
      },
      slots: {
        default: () => 'Conteúdo',
        footer: () => 'Rodapé'
      }
    })

    expect(wrapperCompact.find('header').classes()).toContain('px-4')
    expect(wrapperCompact.find('header').classes()).toContain('py-2.5')
    expect(wrapperCompact.find('footer').classes()).toContain('px-4')
  })
})
