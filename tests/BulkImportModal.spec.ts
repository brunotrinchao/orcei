import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BulkImportModal from '../app/components/settings/BulkImportModal.vue'

const fetchMock = vi.fn()
vi.stubGlobal('$fetch', fetchMock)

function makeCsvFile(content: string): File {
  const file = new File([content], 'clientes.csv', { type: 'text/csv' })
  if (!file.text) {
    file.text = () => Promise.resolve(content)
  }
  return file
}

async function selectFile(wrapper: any, file: File) {
  await wrapper.vm.$nextTick()
  const inputWrapper = wrapper.find('input[type="file"]')
  const inputEl = inputWrapper.exists() ? inputWrapper.element : document.querySelector('input[type="file"]')
  if (!inputEl) throw new Error('input[type="file"] not found in DOM')
  Object.defineProperty(inputEl, 'files', { value: [file], configurable: true })
  inputEl.dispatchEvent(new Event('change', { bubbles: true }))
  await wrapper.vm.$nextTick()
  await Promise.resolve()
}

function getBodyText(wrapper: any): string {
  return (wrapper.text() + ' ' + (document.body ? document.body.textContent : '')).trim()
}

describe('BulkImportModal', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    if (document.body) document.body.innerHTML = ''
  })

  it('mostra preview com contagem de linhas após upload de CSV válido', async () => {
    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'client' } })
    await selectFile(wrapper, makeCsvFile('name,email\nJoão,joao@email.com\nMaria,maria@email.com'))

    const text = getBodyText(wrapper)
    expect(text).toContain('2')
    expect(text).toContain('João')
    expect(text).toContain('Maria')
  })

  it('rejeita arquivo maior que 2MB sem entrar no preview', async () => {
    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'client' } })
    const bigContent = 'name,email\n' + 'a,a@email.com\n'.repeat(200_000) // > 2MB
    await selectFile(wrapper, makeCsvFile(bigContent))

    const text = getBodyText(wrapper)
    expect(text).toMatch(/2\s*mb/i)
    const hasTable = wrapper.find('table').exists() || !!document.querySelector('table')
    expect(hasTable).toBe(false)
  })

  it('processa em lotes, atualiza contador de progresso e mostra resumo final', async () => {
    fetchMock
      .mockResolvedValueOnce({ results: [{ index: 0, status: 'created' }, { index: 1, status: 'skipped', message: 'E-mail já cadastrado' }] })

    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'client' } })
    await selectFile(wrapper, makeCsvFile('name,email\nJoão,joao@email.com\nMaria,maria@email.com'))

    const buttons = Array.from(document.querySelectorAll('button'))
    const processButton = buttons.find(b => b.textContent?.includes('Processar'))
    if (!processButton) throw new Error('Process button not found')

    processButton.click()
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledWith('/api/clients/bulk', expect.objectContaining({
      method: 'POST',
      body: { rows: expect.arrayContaining([expect.objectContaining({ name: 'João' })]) }
    }))
    const text = getBodyText(wrapper)
    expect(text).toContain('1') // 1 criado
    expect(text).toContain('E-mail já cadastrado')
  })

  it('usa endpoint /api/catalog/bulk quando type="catalog"', async () => {
    fetchMock.mockResolvedValueOnce({ results: [{ index: 0, status: 'created' }] })

    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'catalog' } })
    await selectFile(wrapper, makeCsvFile('type,name,price\nproduct,Item,10'))

    const buttons = Array.from(document.querySelectorAll('button'))
    const processButton = buttons.find(b => b.textContent?.includes('Processar'))
    if (!processButton) throw new Error('Process button not found')

    processButton.click()
    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledWith('/api/catalog/bulk', expect.anything())
  })
})
