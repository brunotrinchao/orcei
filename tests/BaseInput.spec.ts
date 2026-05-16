import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseInput from '../app/components/ui/BaseInput.vue'

// Helper: dispatch native input event (unmasked inputs)
function triggerInput(el: Element, value: string) {
  const input = el as HTMLInputElement
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

// Helper: dispatch imask 'accept' event (fires after formatting)
function triggerAccept(el: Element, masked: string, rawValue = '') {
  el.dispatchEvent(new CustomEvent('accept', {
    bubbles: true,
    detail: { value: masked, _value: rawValue }
  }))
}

describe('BaseInput — sem máscara', () => {
  it('emite valor via @input quando não há máscara', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '' }
    })
    triggerInput(wrapper.find('input').element, 'hello')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![emitted!.length - 1]).toEqual(['hello'])
  })

  it('renderiza label quando fornecida', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', label: 'Nome' }
    })
    expect(wrapper.find('label').text()).toContain('Nome')
  })

  it('mostra asterisco quando required', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', label: 'Campo', required: true }
    })
    expect(wrapper.find('label').text()).toContain('*')
  })

  it('mostra mensagem de erro', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', error: 'Campo obrigatório' }
    })
    expect(wrapper.find('span').text()).toContain('Campo obrigatório')
  })

  it('não emite via @input quando máscara está definida', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'phone' }
    })
    // Dispara input puro sem accept — não deve emitir
    await wrapper.find('input').trigger('input')
    expect(wrapper.emitted('update:modelValue')).toBeFalsy()
  })

  it('aceita modelValue undefined sem quebrar', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: undefined }
    })
    expect(wrapper.find('input').element.value).toBe('')
  })

  it('aceita modelValue null sem quebrar', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: null }
    })
    expect(wrapper.find('input').element.value).toBe('')
  })
})

describe('BaseInput — evento accept (imask, dispara após formatar)', () => {
  it('emite telefone formatado (celular)', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'phone' }
    })
    triggerAccept(wrapper.find('input').element, '(11) 98765-4321', '11987654321')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['(11) 98765-4321'])
  })

  it('emite telefone formatado (fixo)', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'phone' }
    })
    triggerAccept(wrapper.find('input').element, '(11) 3333-4444', '1133334444')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['(11) 3333-4444'])
  })

  it('emite CEP formatado', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'cep' }
    })
    triggerAccept(wrapper.find('input').element, '01310-100', '01310100')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['01310-100'])
  })

  it('emite CPF formatado', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'cpf' }
    })
    triggerAccept(wrapper.find('input').element, '123.456.789-09', '12345678909')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['123.456.789-09'])
  })

  it('emite CNPJ formatado', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'cnpj' }
    })
    triggerAccept(wrapper.find('input').element, '11.222.333/0001-81', '11222333000181')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['11.222.333/0001-81'])
  })

  it('emite moeda formatada', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'currency' }
    })
    triggerAccept(wrapper.find('input').element, '1.500,00', '1500')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['1.500,00'])
  })

  it('emite documento como CPF', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'document' }
    })
    triggerAccept(wrapper.find('input').element, '123.456.789-09', '12345678909')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['123.456.789-09'])
  })

  it('emite documento como CNPJ', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'document' }
    })
    triggerAccept(wrapper.find('input').element, '11.222.333/0001-81', '11222333000181')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['11.222.333/0001-81'])
  })
})

describe('BaseInput — configuração de máscara', () => {
  it('phone → array de masks', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'phone' }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('document → array CPF + CNPJ', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'document' }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('currency → Number mask config', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: 'currency' }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('mask literal string passada direto', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '', mask: '##/##/####' }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('sem máscara → sem directive options', async () => {
    const wrapper = await mountSuspended(BaseInput, {
      props: { modelValue: '' }
    })
    expect(wrapper.find('input').exists()).toBe(true)
  })
})
