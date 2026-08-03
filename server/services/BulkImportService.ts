import { validateClient } from '../utils/validate'
import { coerceClientRow } from '../utils/bulkImport'
import { ClientService } from './ClientService'

export type BulkRowResult = {
  index: number
  status: 'created' | 'skipped' | 'error'
  message?: string
}

export const BulkImportService = {
  async processClientRows(rows: Record<string, any>[], profileId: string): Promise<BulkRowResult[]> {
    const results: BulkRowResult[] = []

    for (let index = 0; index < rows.length; index++) {
      const data = coerceClientRow(rows[index])
      const errors = validateClient(data)
      if (errors.length > 0) {
        results.push({ index, status: 'error', message: errors.map(e => e.message).join('; ') })
        continue
      }

      if (data.email && await ClientService.emailExists(profileId, data.email)) {
        results.push({ index, status: 'skipped', message: 'E-mail já cadastrado' })
        continue
      }

      await ClientService.create({ ...data, profileId })
      results.push({ index, status: 'created' })
    }

    return results
  }
}
