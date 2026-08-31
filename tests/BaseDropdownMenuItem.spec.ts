import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { h } from 'vue'
import BaseDropdownMenu from '../app/components/ui/BaseDropdownMenu.vue'
import BaseDropdownMenuItem from '../app/components/ui/BaseDropdownMenuItem.vue'

describe('BaseDropdownMenuItem Component', () => {
  it('renderiza como item de menu normal sem tag <a> quando href não é informado', async () => {
    const wrapper = await mountSuspended(BaseDropdownMenu, {
      props: { open: true },
      slots: {
        default: () => h(BaseDropdownMenuItem, () => 'Item Normal')
      }
    })

    expect(document.body.innerHTML).toContain('Item Normal')
    expect(document.body.querySelector('a')).toBeNull()
  })

  it('renderiza com a tag <a> quando a propriedade href é fornecida para link externo', async () => {
    const wrapper = await mountSuspended(BaseDropdownMenu, {
      props: { open: true },
      slots: {
        default: () => h(BaseDropdownMenuItem, {
          href: 'https://orcei.com.br',
          target: '_blank'
        }, () => 'Visitar Site')
      }
    })

    const link = document.body.querySelector('a[href="https://orcei.com.br"]')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.textContent).toContain('Visitar Site')
  })

  it('renderiza com suporte a mailto: ou tel: através da prop href', async () => {
    const wrapper = await mountSuspended(BaseDropdownMenu, {
      props: { open: true },
      slots: {
        default: () => h(BaseDropdownMenuItem, {
          href: 'mailto:contato@orcei.com.br'
        }, () => 'Enviar E-mail')
      }
    })

    const mailLink = document.body.querySelector('a[href="mailto:contato@orcei.com.br"]')
    expect(mailLink).not.toBeNull()
  })
})
