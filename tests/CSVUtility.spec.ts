import { describe, it, expect } from 'vitest'
import { jsonToCsv } from '../server/utils/csv'

describe('CSV Utility', () => {
  it('should convert simple JSON array to CSV', () => {
    const data = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@example.com' }
    ]
    const csv = jsonToCsv(data)
    expect(csv).toContain('name,email')
    expect(csv).toContain('John Doe,john@example.com')
    expect(csv).toContain('Jane Smith,jane@example.com')
  })

  it('should escape values with commas', () => {
    const data = [{ name: 'Doe, John', city: 'New York' }]
    const csv = jsonToCsv(data)
    expect(csv).toContain('"Doe, John",New York')
  })

  it('should escape double quotes', () => {
    const data = [{ note: 'He said "Hello"' }]
    const csv = jsonToCsv(data)
    expect(csv).toContain('"He said ""Hello"""')
  })

  it('should handle complex objects by stringifying them', () => {
    const data = [{ name: 'John', details: { age: 30, city: 'NY' } }]
    const csv = jsonToCsv(data)
    expect(csv).toContain('John,"{""age"":30,""city"":""NY""}"')
  })

  it('should return empty string for empty data', () => {
    expect(jsonToCsv([])).toBe('')
  })
})
