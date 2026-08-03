import { describe, it, expect } from 'vitest'
import { validateImportFile, parseCsvText, chunkRows, MAX_ROWS } from '../app/composables/useBulkImportParser'

function makeFile(name: string, sizeBytes: number, type = 'text/csv'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

describe('validateImportFile', () => {
  it('aceita CSV até 2MB', () => {
    expect(validateImportFile(makeFile('clientes.csv', 1024))).toBeNull()
  })

  it('rejeita arquivo maior que 2MB', () => {
    const error = validateImportFile(makeFile('clientes.csv', 2 * 1024 * 1024 + 1))
    expect(error).toMatch(/2\s*mb/i)
  })

  it('rejeita extensão diferente de .csv', () => {
    const error = validateImportFile(makeFile('clientes.xlsx', 1024))
    expect(error).toMatch(/csv/i)
  })
})

describe('parseCsvText', () => {
  it('parseia header + linhas em objetos', () => {
    const rows = parseCsvText('name,email\nJoão,joao@email.com\nMaria,maria@email.com')
    expect(rows).toEqual([
      { name: 'João', email: 'joao@email.com' },
      { name: 'Maria', email: 'maria@email.com' }
    ])
  })

  it('ignora linhas vazias', () => {
    const rows = parseCsvText('name,email\nJoão,joao@email.com\n\n')
    expect(rows).toHaveLength(1)
  })

  it('lida com valores entre aspas contendo vírgula', () => {
    const rows = parseCsvText('name,notes\n"Silva, João","obs, com vírgula"')
    expect(rows[0]).toEqual({ name: 'Silva, João', notes: 'obs, com vírgula' })
  })

  it('retorna array vazio para CSV sem linhas de dados', () => {
    expect(parseCsvText('name,email')).toEqual([])
  })
})

describe('chunkRows', () => {
  it('divide array em lotes do tamanho informado', () => {
    const chunks = chunkRows([1, 2, 3, 4, 5], 2)
    expect(chunks).toEqual([[1, 2], [3, 4], [5]])
  })

  it('retorna array vazio para input vazio', () => {
    expect(chunkRows([], 25)).toEqual([])
  })

  it('MAX_ROWS é 1000', () => {
    expect(MAX_ROWS).toBe(1000)
  })
})
