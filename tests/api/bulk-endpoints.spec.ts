import { describe, it, expect } from 'vitest'
import { assertValidBatchSize } from '../../server/utils/bulkImport'

describe('assertValidBatchSize', () => {
  it('não lança erro para lote entre 1 e 25 linhas', () => {
    expect(() => assertValidBatchSize(Array.from({ length: 25 }))).not.toThrow()
    expect(() => assertValidBatchSize([{}])).not.toThrow()
  })

  it('lança erro 400 para lote vazio', () => {
    expect(() => assertValidBatchSize([])).toThrowError(/vazio/i)
  })

  it('lança erro 400 para lote acima de 25 linhas', () => {
    expect(() => assertValidBatchSize(Array.from({ length: 26 }))).toThrowError(/25/)
  })
})
