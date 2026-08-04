import Papa from 'papaparse'

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
export const MAX_ROWS = 500
export const BATCH_SIZE = 25

export function validateImportFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return 'Selecione um arquivo no formato .csv'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Arquivo excede o limite de 2MB'
  }
  return null
}

export function parseCsvText(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true
  })
  return result.data
}

export function chunkRows<T>(rows: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size))
  }
  return chunks
}
