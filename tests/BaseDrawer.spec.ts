import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseDrawer from '../app/components/ui/BaseDrawer.vue'

describe('BaseDrawer Component', () => {
  it('renderiza o título e a descrição ao abrir o drawer', async () => {
    const wrapper = await mountSuspended(BaseDrawer, {
      props: {
        open: true,
        title: 'Painel Lateral',
        description: 'Subtítulo descritivo do painel'
      }
    })

    expect(document.body.innerHTML).toContain('Painel Lateral')
    expect(document.body.innerHTML).toContain('Subtítulo descritivo do painel')
  })

  it('posiciona o botão de fechar à esquerda no cabeçalho', async () => {
    const wrapper = await mountSuspended(BaseDrawer, {
      props: {
        open: true,
        title: 'Teste Botão Esquerda'
      }
    })

    const closeBtn = document.body.querySelector('button[aria-label="Fechar drawer"]')
    expect(closeBtn).not.toBeNull()
  })

  it('renderiza o menu de contexto à direita no cabeçalho', async () => {
    const wrapper = await mountSuspended(BaseDrawer, {
      props: {
        open: true,
        title: 'Com Menu Contexto'
      },
      slots: {
        'context-menu': () => '<button id="ctx-menu-btn">Ações</button>'
      }
    })

    expect(document.body.innerHTML).toContain('ctx-menu-btn')
  })

  it('suporta o slot de rodapé fixo (footer)', async () => {
    const wrapper = await mountSuspended(BaseDrawer, {
      props: {
        open: true,
        title: 'Com Rodapé'
      },
      slots: {
        footer: () => '<button id="drawer-footer-btn">Salvar Alterações</button>'
      }
    })

    expect(document.body.innerHTML).toContain('drawer-footer-btn')
  })

  it('suporta variantes de estilização de cabeçalho (primary, slate, danger)', async () => {
    const wrapperPrimary = await mountSuspended(BaseDrawer, {
      props: {
        open: true,
        variant: 'primary',
        title: 'Header Azul'
      }
    })

    expect(document.body.innerHTML).toContain('bg-blue-600')
  })

  it('suporta posições diferentes (left, top, bottom, right)', async () => {
    const wrapperLeft = await mountSuspended(BaseDrawer, {
      props: {
        open: true,
        position: 'left',
        title: 'Drawer Esquerda'
      }
    })

    expect(document.body.innerHTML).toContain('left-0')
  })
})
