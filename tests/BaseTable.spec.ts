import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTable from '../app/components/ui/BaseTable.vue'

describe('BaseTable.vue', () => {
  it('renderiza os slots #header e #body corretamente', () => {
    const wrapper = mount(BaseTable, {
      props: {
        total: 2
      },
      slots: {
        header: '<th>Nome</th><th>Email</th>',
        body: '<tr><td>Bruno Trinchão</td><td>bruno@email.com</td></tr>'
      }
    })

    expect(wrapper.find('thead').exists()).toBe(true)
    expect(wrapper.text()).toContain('Nome')
    expect(wrapper.text()).toContain('Email')
    expect(wrapper.text()).toContain('Bruno Trinchão')
    expect(wrapper.text()).toContain('bruno@email.com')
  })

  it('exibe mensagem quando total é igual a 0', () => {
    const wrapper = mount(BaseTable, {
      props: {
        total: 0
      }
    })

    expect(wrapper.text()).toContain('Nenhum registro encontrado.')
  })

  it('aplica a classe responsiva hidden md:table-header-group no thead', () => {
    const wrapper = mount(BaseTable, {
      props: { total: 1 },
      slots: {
        header: '<th>Coluna</th>'
      }
    })

    const thead = wrapper.find('thead')
    expect(thead.exists()).toBe(true)
    expect(thead.classes()).toContain('hidden')
    expect(thead.classes()).toContain('md:table-header-group')
  })

  it('suporta modo declarativo inteligente com props columns e items', () => {
    const wrapper = mount(BaseTable, {
      props: {
        columns: [
          { key: 'name', label: 'Nome' },
          { key: 'city', label: 'Cidade', align: 'right' }
        ],
        items: [
          { name: 'Bruno Trinchão', city: 'Belo Horizonte' },
          { name: 'Tatiana Farias', city: 'Fortaleza' }
        ]
      }
    })

    expect(wrapper.text()).toContain('Nome')
    expect(wrapper.text()).toContain('Cidade')
    expect(wrapper.text()).toContain('Bruno Trinchão')
    expect(wrapper.text()).toContain('Belo Horizonte')
    expect(wrapper.text()).toContain('Tatiana Farias')
    expect(wrapper.text()).toContain('Fortaleza')
  })

  it('permite customizar o conteúdo da célula através do slot #cell-{key}', () => {
    const wrapper = mount(BaseTable, {
      props: {
        columns: [{ key: 'email', label: 'E-mail' }],
        items: [{ email: 'brunotrinchao@gmail.com' }]
      },
      slots: {
        'cell-email': '<a href="mailto:brunotrinchao@gmail.com" class="custom-link">Enviar E-mail</a>'
      }
    })

    expect(wrapper.find('.custom-link').exists()).toBe(true)
    expect(wrapper.text()).toContain('Enviar E-mail')
  })
})
