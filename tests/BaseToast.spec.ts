import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseToast from '../app/components/ui/BaseToast.vue'
import { useToast } from '../app/composables/useToast'
import { ShieldAlert } from 'lucide-vue-next'

describe('BaseToast Component', () => {
  it('renderiza o título e a descrição fornecidos via props em texto branco', async () => {
    const wrapper = await mountSuspended(BaseToast, {
      props: {
        title: 'Orçamento Enviado',
        description: 'O cliente recebeu a notificação por e-mail.'
      }
    })

    expect(wrapper.text()).toContain('Orçamento Enviado')
    expect(wrapper.text()).toContain('O cliente recebeu a notificação por e-mail.')
    expect(wrapper.find('h4').classes()).toContain('text-white')
    expect(wrapper.find('p').classes()).toContain('text-white/90')
  })

  it('aplica as posições configuradas (top-right, bottom-left, top-center, etc)', async () => {
    const wrapperTopRight = await mountSuspended(BaseToast, {
      props: { title: 'Notificação', position: 'top-right', standalone: true }
    })
    expect(wrapperTopRight.find('[role="status"]').classes()).toContain('top-5')
    expect(wrapperTopRight.find('[role="status"]').classes()).toContain('right-5')

    const wrapperBottomLeft = await mountSuspended(BaseToast, {
      props: { title: 'Notificação', position: 'bottom-left', standalone: true }
    })
    expect(wrapperBottomLeft.find('[role="status"]').classes()).toContain('bottom-5')
    expect(wrapperBottomLeft.find('[role="status"]').classes()).toContain('left-5')
  })

  it('aplica a variante de cor selecionada (success, danger, warning, violet, neutral)', async () => {
    const wrapperSuccess = await mountSuspended(BaseToast, {
      props: { title: 'Sucesso', variant: 'success', standalone: true }
    })
    expect(wrapperSuccess.find('[role="status"]').attributes('class')).toContain('bg-green-950/90')

    const wrapperDanger = await mountSuspended(BaseToast, {
      props: { title: 'Erro', variant: 'danger', standalone: true }
    })
    expect(wrapperDanger.find('[role="status"]').attributes('class')).toContain('bg-red-950/90')

    const wrapperViolet = await mountSuspended(BaseToast, {
      props: { title: 'Destaque IA', variant: 'violet', standalone: true }
    })
    expect(wrapperViolet.find('[role="status"]').attributes('class')).toContain('bg-violet-950/90')
  })

  it('permite ícone customizado via prop icon', async () => {
    const wrapper = await mountSuspended(BaseToast, {
      props: {
        title: 'Alerta de Segurança',
        icon: ShieldAlert
      }
    })

    expect(wrapper.findComponent(ShieldAlert).exists()).toBe(true)
  })

  it('dispara eventos ao clicar no botão de fechar', async () => {
    const wrapper = await mountSuspended(BaseToast, {
      props: { title: 'Fechar Teste' }
    })

    const closeBtn = wrapper.find('button[aria-label="Fechar notificação"]')
    expect(closeBtn.exists()).toBe(true)

    await closeBtn.trigger('click')
    expect(wrapper.emitted('dismiss')).toBeTruthy()
  })
})

describe('useToast Composable', () => {
  beforeEach(() => {
    const { clear } = useToast()
    clear()
  })

  it('adiciona e remove toasts da fila reativa', () => {
    const { toasts, show, dismiss, clear } = useToast()
    expect(toasts.value.length).toBe(0)

    const id = show({ title: 'Novo Orçamento', variant: 'success' })
    expect(toasts.value.length).toBe(1)
    expect(toasts.value[0].title).toBe('Novo Orçamento')

    dismiss(id)
    expect(toasts.value.length).toBe(0)
  })

  it('suporta métodos auxiliares (success, error, warning, info)', () => {
    const { toasts, success, error, warning, info } = useToast()

    success('Item Salvo', 'Descrição')
    error('Erro ao Salvar')
    warning('Atenção')
    info('Informação')

    expect(toasts.value.length).toBe(4)
    expect(toasts.value[0].variant).toBe('success')
    expect(toasts.value[1].variant).toBe('danger')
    expect(toasts.value[2].variant).toBe('warning')
    expect(toasts.value[3].variant).toBe('info')
  })
})
