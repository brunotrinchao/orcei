import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseCallout from '../app/components/ui/BaseCallout.vue'
import { ShieldCheck } from 'lucide-vue-next'

describe('BaseCallout Component', () => {
  it('renderiza o título e a descrição fornecidos via props', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: {
        title: 'Aviso Importante',
        description: 'Esta é uma descrição de teste para o callout.'
      }
    })

    expect(wrapper.text()).toContain('Aviso Importante')
    expect(wrapper.text()).toContain('Esta é uma descrição de teste para o callout.')
  })

  it('não possui bordas visíveis (borda zero/transparente)', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: {
        title: 'Sem Borda'
      }
    })

    const classAttr = wrapper.find('[role="alert"]').attributes('class') || ''
    expect(classAttr).toContain('border-0')
    expect(classAttr).toContain('border-transparent')
  })

  it('aplica a variante de cores info por padrão', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: { title: 'Info Default' }
    })

    expect(wrapper.find('[role="alert"]').attributes('class')).toContain('bg-blue-600/70')
  })

  it('aplica variante success corretamente', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: { variant: 'success', title: 'Sucesso' }
    })

    expect(wrapper.find('[role="alert"]').attributes('class')).toContain('bg-emerald-50/70')
  })

  it('aplica variante warning corretamente', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: { variant: 'warning', title: 'Atenção' }
    })

    expect(wrapper.find('[role="alert"]').attributes('class')).toContain('bg-amber-50/70')
  })

  it('aplica variante error/danger corretamente', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: { variant: 'danger', title: 'Erro' }
    })

    expect(wrapper.find('[role="alert"]').attributes('class')).toContain('bg-red-50/70')
  })

  it('aplica variante neutral corretamente', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: { variant: 'neutral', title: 'Neutro' }
    })

    expect(wrapper.find('[role="alert"]').attributes('class')).toContain('bg-slate-100/70')
  })

  it('suporta slots de título, conteúdo e ícone', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      slots: {
        title: () => 'Título Slot',
        default: () => 'Conteúdo Slot Principal',
        icon: () => '<span>IconSlot</span>'
      }
    })

    expect(wrapper.text()).toContain('Título Slot')
    expect(wrapper.text()).toContain('Conteúdo Slot Principal')
    expect(wrapper.text()).toContain('IconSlot')
  })

  it('permite passar componente de ícone customizado via prop icon', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: {
        icon: ShieldCheck
      }
    })

    expect(wrapper.findComponent(ShieldCheck).exists()).toBe(true)
  })

  it('oculta o ícone quando icon é false', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: {
        icon: false,
        title: 'Sem Ícone'
      }
    })

    expect(wrapper.find('.w-9.h-9').exists()).toBe(false)
  })

  it('suporta o modo dismissible e dispara o evento dismiss ao clicar no botão de fechar', async () => {
    const wrapper = await mountSuspended(BaseCallout, {
      props: {
        dismissible: true,
        title: 'Callout Fechável'
      }
    })

    const closeBtn = wrapper.find('button[aria-label="Fechar aviso"]')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })
})
