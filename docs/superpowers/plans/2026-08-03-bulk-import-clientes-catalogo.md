# Múltiplos Cadastros (Importação em Massa CSV) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir importar Clientes e itens de Catálogo em lote via upload de CSV, numa nova seção "Múltiplos Cadastros" em Configurações.

**Architecture:** Parse de CSV client-side (papaparse), preview antes de enviar. Envio em lotes de 25 linhas pro backend, que valida/cria/pula duplicata linha a linha e retorna resultado por linha. Lógica de processamento em lote isolada em `BulkImportService` (testável sem HTTP), endpoints ficam finos (auth + delegação).

**Tech Stack:** Nuxt 3 (Vue 3 `<script setup>`), Mongoose, Vitest + `@nuxt/test-utils/runtime` (`mountSuspended`), `papaparse` (nova dependência).

## Global Constraints

- Limite de arquivo: 2MB (`MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024`).
- Limite de linhas por arquivo: 1000 (`MAX_ROWS = 1000`).
- Tamanho de lote enviado ao backend: 25 linhas (`BATCH_SIZE = 25`), backend rejeita lote com `rows.length > 25`.
- Duplicata (email de cliente / sku de catálogo já cadastrado no `profileId`) → `status: 'skipped'`, nunca atualiza registro existente.
- Sem parse de CSV no backend — endpoint recebe JSON já parseado pelo frontend.
- Seguir padrão de arquivos existente: `server/services/*Service.ts`, `server/api/<recurso>/<ação>.<método>.ts`, `app/components/settings/SettingsX.vue`.

---

## Task 1: `BulkImportService` — coerção e processamento de linhas (Cliente)

**Files:**
- Create: `server/utils/bulkImport.ts`
- Create: `server/services/BulkImportService.ts`
- Test: `tests/BulkImportUtility.spec.ts`
- Test: `tests/BulkImportService.spec.ts`

**Interfaces:**
- Consumes: `validateClient`, `throwIfInvalid` de `server/utils/validate.ts` (já existe); `ClientService.emailExists(profileId, email)`, `ClientService.create(data)` de `server/services/ClientService.ts` (já existe).
- Produces:
  - `coerceClientRow(row: Record<string, any>): Record<string, any>` em `server/utils/bulkImport.ts`.
  - `type BulkRowResult = { index: number; status: 'created' | 'skipped' | 'error'; message?: string }` em `server/services/BulkImportService.ts`.
  - `BulkImportService.processClientRows(rows: Record<string, any>[], profileId: string): Promise<BulkRowResult[]>`.

- [ ] **Step 1: Escrever teste de `coerceClientRow` (falhando)**

```typescript
// tests/BulkImportUtility.spec.ts
import { describe, it, expect } from 'vitest'
import { coerceClientRow } from '../server/utils/bulkImport'

describe('coerceClientRow', () => {
  it('converte isWhatsapp string "true"/"1" para boolean true', () => {
    expect(coerceClientRow({ isWhatsapp: 'true' }).isWhatsapp).toBe(true)
    expect(coerceClientRow({ isWhatsapp: '1' }).isWhatsapp).toBe(true)
  })

  it('converte isWhatsapp string "false"/"0"/vazio para boolean false', () => {
    expect(coerceClientRow({ isWhatsapp: 'false' }).isWhatsapp).toBe(false)
    expect(coerceClientRow({ isWhatsapp: '0' }).isWhatsapp).toBe(false)
    expect(coerceClientRow({ isWhatsapp: '' }).isWhatsapp).toBe(false)
    expect(coerceClientRow({}).isWhatsapp).toBe(false)
  })

  it('monta address a partir das colunas planas do CSV (street, number, neighborhood, city, state, zip)', () => {
    const result = coerceClientRow({
      name: 'João', email: 'joao@email.com',
      street: 'Rua A', number: '10', neighborhood: 'Centro', city: 'SP', state: 'SP', zip: '01000-000'
    })
    expect(result.address).toEqual({
      street: 'Rua A', number: '10', neighborhood: 'Centro', city: 'SP', state: 'SP', zip: '01000-000'
    })
  })

  it('não inclui address quando nenhuma coluna de endereço está presente', () => {
    const result = coerceClientRow({ name: 'João', email: 'joao@email.com' })
    expect(result.address).toBeUndefined()
  })

  it('mantém campos simples (name, email, phone, taxId, notes) como estão, com trim', () => {
    const result = coerceClientRow({ name: '  João  ', email: ' joao@email.com ', phone: '11999999999', taxId: '123', notes: 'obs' })
    expect(result.name).toBe('João')
    expect(result.email).toBe('joao@email.com')
    expect(result.phone).toBe('11999999999')
    expect(result.taxId).toBe('123')
    expect(result.notes).toBe('obs')
  })
})
```

- [ ] **Step 2: Rodar teste, confirmar falha**

Run: `npx vitest run tests/BulkImportUtility.spec.ts`
Expected: FAIL — `server/utils/bulkImport.ts` não existe.

- [ ] **Step 3: Implementar `coerceClientRow`**

```typescript
// server/utils/bulkImport.ts
const TRUTHY = new Set(['true', '1', 'sim', 'yes'])

function toBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value
  return TRUTHY.has(String(value ?? '').trim().toLowerCase())
}

function str(value: any): string | undefined {
  const trimmed = String(value ?? '').trim()
  return trimmed === '' ? undefined : trimmed
}

export function coerceClientRow(row: Record<string, any>): Record<string, any> {
  const address = ['street', 'number', 'neighborhood', 'city', 'state', 'zip']
    .some((key) => str(row[key]) !== undefined)
    ? {
        street: str(row.street),
        number: str(row.number),
        neighborhood: str(row.neighborhood),
        city: str(row.city),
        state: str(row.state),
        zip: str(row.zip)
      }
    : undefined

  return {
    name: str(row.name),
    email: str(row.email),
    phone: str(row.phone),
    isWhatsapp: toBoolean(row.isWhatsapp),
    taxId: str(row.taxId),
    notes: str(row.notes),
    ...(address ? { address } : {})
  }
}
```

- [ ] **Step 4: Rodar teste, confirmar sucesso**

Run: `npx vitest run tests/BulkImportUtility.spec.ts`
Expected: PASS (todos os casos).

- [ ] **Step 5: Commit**

```bash
git add server/utils/bulkImport.ts tests/BulkImportUtility.spec.ts
git commit -m "feat: coerção de linha CSV para cadastro de cliente"
```

- [ ] **Step 6: Escrever teste de `BulkImportService.processClientRows` (falhando)**

```typescript
// tests/BulkImportService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BulkImportService } from '../server/services/BulkImportService'
import { ClientService } from '../server/services/ClientService'

vi.mock('../server/services/ClientService', () => ({
  ClientService: {
    emailExists: vi.fn(),
    create: vi.fn()
  }
}))

describe('BulkImportService.processClientRows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria linha válida sem duplicata', async () => {
    vi.mocked(ClientService.emailExists).mockResolvedValue(false)
    vi.mocked(ClientService.create).mockResolvedValue({ _id: 'c1' } as any)

    const results = await BulkImportService.processClientRows(
      [{ name: 'João', email: 'joao@email.com' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'created' }])
    expect(ClientService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'João', email: 'joao@email.com', profileId: 'profile_1' })
    )
  })

  it('marca como skipped quando email já existe', async () => {
    vi.mocked(ClientService.emailExists).mockResolvedValue(true)

    const results = await BulkImportService.processClientRows(
      [{ name: 'João', email: 'joao@email.com' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'skipped', message: 'E-mail já cadastrado' }])
    expect(ClientService.create).not.toHaveBeenCalled()
  })

  it('marca como error quando linha é inválida (sem nome)', async () => {
    const results = await BulkImportService.processClientRows(
      [{ email: 'joao@email.com' }],
      'profile_1'
    )

    expect(results[0].status).toBe('error')
    expect(results[0].message).toContain('Nome é obrigatório')
    expect(ClientService.create).not.toHaveBeenCalled()
  })

  it('processa lote misto preservando o index original de cada linha', async () => {
    vi.mocked(ClientService.emailExists)
      .mockResolvedValueOnce(false) // linha 0: criada
      .mockResolvedValueOnce(true)  // linha 2: skip
    vi.mocked(ClientService.create).mockResolvedValue({ _id: 'c1' } as any)

    const results = await BulkImportService.processClientRows(
      [
        { name: 'A', email: 'a@email.com' },
        { name: '' , email: 'invalida' },
        { name: 'C', email: 'c@email.com' }
      ],
      'profile_1'
    )

    expect(results.map(r => r.status)).toEqual(['created', 'error', 'skipped'])
    expect(results.map(r => r.index)).toEqual([0, 1, 2])
  })
})
```

- [ ] **Step 7: Rodar teste, confirmar falha**

Run: `npx vitest run tests/BulkImportService.spec.ts`
Expected: FAIL — `server/services/BulkImportService.ts` não existe.

- [ ] **Step 8: Implementar `processClientRows`**

```typescript
// server/services/BulkImportService.ts
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
```

Este arquivo fica assim, completo e compilável, até o fim desta task. `processCatalogRows` é adicionado na Task 2 (Step 13 reescreve o arquivo inteiro com as duas funções).

- [ ] **Step 9: Rodar teste, confirmar sucesso**

Run: `npx vitest run tests/BulkImportService.spec.ts`
Expected: PASS (4 testes de `processClientRows`).

- [ ] **Step 10: Commit**

```bash
git add server/services/BulkImportService.ts tests/BulkImportService.spec.ts
git commit -m "feat: processamento em lote de importação de clientes"
```

---

## Task 2: `BulkImportService.processCatalogRows` + `CatalogService.skuExists`

**Files:**
- Modify: `server/utils/bulkImport.ts`
- Modify: `server/services/CatalogService.ts`
- Modify: `server/services/BulkImportService.ts`
- Test: `tests/BulkImportUtility.spec.ts` (adicionar casos)
- Test: `tests/BulkImportService.spec.ts` (adicionar casos)

**Interfaces:**
- Consumes: `validateCatalogItem` de `server/utils/validate.ts`.
- Produces:
  - `coerceCatalogRow(row: Record<string, any>): Record<string, any>` em `server/utils/bulkImport.ts`.
  - `CatalogService.skuExists(profileId: string, sku: string): Promise<boolean>`.
  - `BulkImportService.processCatalogRows(rows: Record<string, any>[], profileId: string): Promise<BulkRowResult[]>` (mesmo tipo `BulkRowResult` da Task 1).

- [ ] **Step 1: Escrever teste de `coerceCatalogRow` (falhando)**

```typescript
// tests/BulkImportUtility.spec.ts (adicionar ao arquivo existente)
import { coerceCatalogRow } from '../server/utils/bulkImport'

describe('coerceCatalogRow', () => {
  it('converte price string para number', () => {
    expect(coerceCatalogRow({ type: 'product', name: 'Item', price: '49.90' }).price).toBe(49.9)
  })

  it('mantém price inválido (não numérico) como NaN pra validação pegar depois', () => {
    expect(Number.isNaN(coerceCatalogRow({ type: 'product', name: 'Item', price: 'abc' }).price)).toBe(true)
  })

  it('default unit para "UN" quando ausente', () => {
    expect(coerceCatalogRow({ type: 'product', name: 'Item', price: '10' }).unit).toBe('UN')
  })

  it('mantém type, name, sku, description como strings com trim', () => {
    const result = coerceCatalogRow({ type: ' service ', name: ' Corte ', price: '10', sku: ' SKU-1 ', description: ' desc ' })
    expect(result.type).toBe('service')
    expect(result.name).toBe('Corte')
    expect(result.sku).toBe('SKU-1')
    expect(result.description).toBe('desc')
  })
})
```

- [ ] **Step 2: Rodar teste, confirmar falha**

Run: `npx vitest run tests/BulkImportUtility.spec.ts`
Expected: FAIL — `coerceCatalogRow` não exportado.

- [ ] **Step 3: Implementar `coerceCatalogRow`**

```typescript
// server/utils/bulkImport.ts (adicionar ao arquivo existente)
export function coerceCatalogRow(row: Record<string, any>): Record<string, any> {
  return {
    type: str(row.type)?.toLowerCase(),
    name: str(row.name),
    description: str(row.description),
    price: Number(String(row.price ?? '').trim().replace(',', '.')),
    unit: str(row.unit) ?? 'UN',
    sku: str(row.sku)
  }
}
```

- [ ] **Step 4: Rodar teste, confirmar sucesso**

Run: `npx vitest run tests/BulkImportUtility.spec.ts`
Expected: PASS (todos os casos de cliente + catálogo).

- [ ] **Step 5: Commit**

```bash
git add server/utils/bulkImport.ts tests/BulkImportUtility.spec.ts
git commit -m "feat: coerção de linha CSV para cadastro de catálogo"
```

- [ ] **Step 6: Escrever teste de `CatalogService.skuExists` (falhando)**

```typescript
// tests/CatalogService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CatalogItem } from '../server/models/CatalogItem'
import { CatalogService } from '../server/services/CatalogService'

vi.mock('../server/models/CatalogItem', () => ({
  CatalogItem: { findOne: vi.fn() }
}))

describe('CatalogService.skuExists', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retorna false quando sku é vazio', async () => {
    expect(await CatalogService.skuExists('profile_1', '')).toBe(false)
    expect(CatalogItem.findOne).not.toHaveBeenCalled()
  })

  it('retorna true quando encontra item com mesmo sku no profile', async () => {
    vi.mocked(CatalogItem.findOne).mockReturnValue({ select: vi.fn().mockResolvedValue({ _id: 'x' }) } as any)
    expect(await CatalogService.skuExists('profile_1', 'SKU-1')).toBe(true)
  })

  it('retorna false quando não encontra', async () => {
    vi.mocked(CatalogItem.findOne).mockReturnValue({ select: vi.fn().mockResolvedValue(null) } as any)
    expect(await CatalogService.skuExists('profile_1', 'SKU-1')).toBe(false)
  })
})
```

- [ ] **Step 7: Rodar teste, confirmar falha**

Run: `npx vitest run tests/CatalogService.spec.ts`
Expected: FAIL — `skuExists` não existe em `CatalogService`.

- [ ] **Step 8: Implementar `CatalogService.skuExists`**

```typescript
// server/services/CatalogService.ts (adicionar ao objeto CatalogService existente)
async skuExists(profileId: string, sku: string): Promise<boolean> {
  const trimmed = sku?.trim()
  if (!trimmed) return false
  const existing = await CatalogItem.findOne({ profileId, sku: trimmed }).select('_id')
  return !!existing
}
```

- [ ] **Step 9: Rodar teste, confirmar sucesso**

Run: `npx vitest run tests/CatalogService.spec.ts`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add server/services/CatalogService.ts tests/CatalogService.spec.ts
git commit -m "feat: checagem de SKU duplicado no catálogo"
```

- [ ] **Step 11: Escrever teste de `BulkImportService.processCatalogRows` (falhando)**

```typescript
// tests/BulkImportService.spec.ts (adicionar ao arquivo existente)
import { CatalogService } from '../server/services/CatalogService'

vi.mock('../server/services/CatalogService', () => ({
  CatalogService: {
    skuExists: vi.fn(),
    create: vi.fn()
  }
}))

describe('BulkImportService.processCatalogRows', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cria linha válida sem sku duplicado', async () => {
    vi.mocked(CatalogService.skuExists).mockResolvedValue(false)
    vi.mocked(CatalogService.create).mockResolvedValue({ _id: 'i1' } as any)

    const results = await BulkImportService.processCatalogRows(
      [{ type: 'product', name: 'Item', price: '10', sku: 'SKU-1' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'created' }])
  })

  it('marca skipped quando sku já existe', async () => {
    vi.mocked(CatalogService.skuExists).mockResolvedValue(true)

    const results = await BulkImportService.processCatalogRows(
      [{ type: 'product', name: 'Item', price: '10', sku: 'SKU-1' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'skipped', message: 'SKU já cadastrado' }])
    expect(CatalogService.create).not.toHaveBeenCalled()
  })

  it('marca error quando type é inválido', async () => {
    const results = await BulkImportService.processCatalogRows(
      [{ type: 'invalido', name: 'Item', price: '10' }],
      'profile_1'
    )

    expect(results[0].status).toBe('error')
    expect(CatalogService.create).not.toHaveBeenCalled()
  })

  it('não checa sku duplicado quando linha não tem sku', async () => {
    vi.mocked(CatalogService.create).mockResolvedValue({ _id: 'i1' } as any)

    const results = await BulkImportService.processCatalogRows(
      [{ type: 'service', name: 'Corte', price: '30' }],
      'profile_1'
    )

    expect(results).toEqual([{ index: 0, status: 'created' }])
    expect(CatalogService.skuExists).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 12: Rodar teste, confirmar falha**

Run: `npx vitest run tests/BulkImportService.spec.ts`
Expected: FAIL — `processCatalogRows` não existe.

- [ ] **Step 13: Implementar `processCatalogRows` e completar o arquivo**

```typescript
// server/services/BulkImportService.ts (arquivo completo agora)
import { validateClient, validateCatalogItem } from '../utils/validate'
import { coerceClientRow, coerceCatalogRow } from '../utils/bulkImport'
import { ClientService } from './ClientService'
import { CatalogService } from './CatalogService'

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
  },

  async processCatalogRows(rows: Record<string, any>[], profileId: string): Promise<BulkRowResult[]> {
    const results: BulkRowResult[] = []

    for (let index = 0; index < rows.length; index++) {
      const data = coerceCatalogRow(rows[index])
      const errors = validateCatalogItem(data)
      if (errors.length > 0) {
        results.push({ index, status: 'error', message: errors.map(e => e.message).join('; ') })
        continue
      }

      if (data.sku && await CatalogService.skuExists(profileId, data.sku)) {
        results.push({ index, status: 'skipped', message: 'SKU já cadastrado' })
        continue
      }

      await CatalogService.create({ ...data, profileId })
      results.push({ index, status: 'created' })
    }

    return results
  }
}
```

- [ ] **Step 14: Rodar todos os testes do service, confirmar sucesso**

Run: `npx vitest run tests/BulkImportService.spec.ts`
Expected: PASS (8 testes: 4 de cliente + 4 de catálogo).

- [ ] **Step 15: Commit**

```bash
git add server/services/BulkImportService.ts tests/BulkImportService.spec.ts
git commit -m "feat: processamento em lote de importação de catálogo"
```

---

## Task 3: Endpoints `POST /api/clients/bulk` e `POST /api/catalog/bulk`

**Files:**
- Create: `server/api/clients/bulk.post.ts`
- Create: `server/api/catalog/bulk.post.ts`
- Test: `tests/api/bulk-endpoints.spec.ts`

**Interfaces:**
- Consumes: `BulkImportService.processClientRows`/`processCatalogRows` (Tasks 1-2), `ProfileService.getByUserId` (já existe, ver `server/api/clients/index.post.ts:1,12`), `getUserSession` (já existe globalmente via `#auth`/Nuxt).
- Produces: resposta HTTP `{ results: BulkRowResult[] }` em `POST /api/clients/bulk` e `POST /api/catalog/bulk`.

Como os handlers usam `defineEventHandler`/`getUserSession`/`readBody` (globals do Nuxt não resolvidos fora do runtime), o teste desta task cobre a lógica de guarda de tamanho de lote isolada numa função pura, e reexercita `BulkImportService` (já coberto nas Tasks 1-2) — mesmo padrão de "teste de API" leve já usado em `tests/api/catalog-delete.spec.ts` (testa o service diretamente, não o handler h3).

- [ ] **Step 1: Escrever teste da validação de tamanho de lote (falhando)**

```typescript
// tests/api/bulk-endpoints.spec.ts
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
```

- [ ] **Step 2: Rodar teste, confirmar falha**

Run: `npx vitest run tests/api/bulk-endpoints.spec.ts`
Expected: FAIL — `assertValidBatchSize` não existe.

- [ ] **Step 3: Implementar `assertValidBatchSize`**

```typescript
// server/utils/bulkImport.ts (adicionar ao arquivo existente)
export const BULK_BATCH_LIMIT = 25

export function assertValidBatchSize(rows: unknown[]): void {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Lote de importação vazio.' })
  }
  if (rows.length > BULK_BATCH_LIMIT) {
    throw createError({ statusCode: 400, statusMessage: `Lote de importação excede o limite de ${BULK_BATCH_LIMIT} linhas.` })
  }
}
```

- [ ] **Step 4: Rodar teste, confirmar sucesso**

Run: `npx vitest run tests/api/bulk-endpoints.spec.ts`
Expected: PASS.

- [ ] **Step 5: Implementar os dois endpoints (sem teste de handler h3, ver nota acima)**

```typescript
// server/api/clients/bulk.post.ts
import { ProfileService } from '../../services/ProfileService'
import { BulkImportService } from '../../services/BulkImportService'
import { assertValidBatchSize } from '../../utils/bulkImport'

export default defineEventHandler(async (event) => {
  const sessionPromise = getUserSession(event)
  const bodyPromise = readBody(event)

  const session = await sessionPromise
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const body = await bodyPromise
  assertValidBatchSize(body?.rows)

  const results = await BulkImportService.processClientRows(body.rows, String(profile._id))
  return { results }
})
```

```typescript
// server/api/catalog/bulk.post.ts
import { ProfileService } from '../../services/ProfileService'
import { BulkImportService } from '../../services/BulkImportService'
import { assertValidBatchSize } from '../../utils/bulkImport'

export default defineEventHandler(async (event) => {
  const sessionPromise = getUserSession(event)
  const bodyPromise = readBody(event)

  const session = await sessionPromise
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const body = await bodyPromise
  assertValidBatchSize(body?.rows)

  const results = await BulkImportService.processCatalogRows(body.rows, String(profile._id))
  return { results }
})
```

- [ ] **Step 6: Rodar toda a suíte de backend, confirmar que nada quebrou**

Run: `npx vitest run tests/`
Expected: PASS em todos os arquivos, incluindo os novos.

- [ ] **Step 7: Commit**

```bash
git add server/api/clients/bulk.post.ts server/api/catalog/bulk.post.ts server/utils/bulkImport.ts tests/api/bulk-endpoints.spec.ts
git commit -m "feat: endpoints de importação em massa para clientes e catálogo"
```

---

## Task 4: Dependência `papaparse` + composable de parsing/validação de arquivo

**Files:**
- Modify: `package.json` (adicionar `papaparse`, `@types/papaparse`)
- Create: `app/composables/useBulkImportParser.ts`
- Test: `tests/useBulkImportParser.spec.ts`

**Interfaces:**
- Consumes: `Papa.parse` de `papaparse`.
- Produces:
  - `validateImportFile(file: File): string | null` — retorna mensagem de erro ou `null` se ok. Usa constantes `MAX_FILE_SIZE_BYTES` (2MB) e extensão `.csv`.
  - `parseCsvText(text: string): Record<string, string>[]`.
  - `MAX_ROWS = 1000`.
  - `chunkRows<T>(rows: T[], size: number): T[][]`.

- [ ] **Step 1: Instalar dependências**

```bash
npm install papaparse
npm install -D @types/papaparse
```

- [ ] **Step 2: Escrever testes (falhando)**

```typescript
// tests/useBulkImportParser.spec.ts
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
```

- [ ] **Step 3: Rodar teste, confirmar falha**

Run: `npx vitest run tests/useBulkImportParser.spec.ts`
Expected: FAIL — módulo não existe.

- [ ] **Step 4: Implementar `useBulkImportParser.ts`**

```typescript
// app/composables/useBulkImportParser.ts
import Papa from 'papaparse'

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
export const MAX_ROWS = 1000
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
```

- [ ] **Step 5: Rodar teste, confirmar sucesso**

Run: `npx vitest run tests/useBulkImportParser.spec.ts`
Expected: PASS (11 testes).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json app/composables/useBulkImportParser.ts tests/useBulkImportParser.spec.ts
git commit -m "feat: parsing e validação de arquivo CSV no client"
```

---

## Task 5: Templates CSV estáticos

**Files:**
- Create: `public/templates/modelo-clientes.csv`
- Create: `public/templates/modelo-catalogo.csv`

**Interfaces:**
- Consumes: nenhum.
- Produces: URLs públicas `/templates/modelo-clientes.csv` e `/templates/modelo-catalogo.csv`, servidas como estáticas pelo Nuxt (pasta `public/`).

- [ ] **Step 1: Criar `modelo-clientes.csv`**

```csv
name,email,phone,isWhatsapp,taxId,street,number,neighborhood,city,state,zip,notes
João da Silva,joao@email.com,11999999999,true,123.456.789-00,Rua das Flores,100,Centro,São Paulo,SP,01000-000,Cliente indicado por parceiro
```

- [ ] **Step 2: Criar `modelo-catalogo.csv`**

```csv
type,name,description,price,unit,sku
product,Camiseta Básica,Camiseta 100% algodão,49.90,UN,CAM-001
```

- [ ] **Step 3: Verificar manualmente que os arquivos são servidos**

Run: `npm run dev` (ou `nuxt dev`), depois `curl -I http://localhost:3000/templates/modelo-clientes.csv`
Expected: `200 OK`.

- [ ] **Step 4: Commit**

```bash
git add public/templates/modelo-clientes.csv public/templates/modelo-catalogo.csv
git commit -m "feat: templates CSV de exemplo para importação"
```

---

## Task 6: Seção "Múltiplos Cadastros" em Configurações (navegação)

**Files:**
- Modify: `app/pages/configuracoes/index.vue`

**Interfaces:**
- Consumes: `useRoute()` (Nuxt global).
- Produces: `activeSection` inicializado a partir de `route.query.section` quando presente e válido; novo item `{ id: 'multiplos-cadastros', label: 'Múltiplos Cadastros', icon: Upload }` no array `sections`.

- [ ] **Step 1: Adicionar import do ícone e novo item em `sections`**

Em `app/pages/configuracoes/index.vue:2`, adicionar `Upload` ao import existente de `lucide-vue-next`:

```typescript
import { SwatchBook, MapPin, Briefcase, FileText, Phone, RefreshCcw, Shield, Globe, ShieldCheck, Lock, CheckCircle2, Wand2, Upload } from 'lucide-vue-next'
```

Em `app/pages/configuracoes/index.vue:100-109`, adicionar item ao array `sections` (antes de `privacidade`, depois de `modelos`):

```typescript
const sections = [
  { id: 'visual',   label: 'Visual',   icon: SwatchBook },
  { id: 'empresa',  label: 'Empresa',  icon: Briefcase },
  { id: 'endereco', label: 'Endereço', icon: MapPin },
  { id: 'contato',  label: 'Contato',  icon: Phone },
  { id: 'integracoes', label: 'Integrações', icon: Globe },
  { id: 'negocio',  label: 'Negócio',  icon: RefreshCcw },
  { id: 'modelos',  label: 'Modelos',  icon: FileText },
  { id: 'multiplos-cadastros', label: 'Múltiplos Cadastros', icon: Upload },
  { id: 'privacidade', label: 'Privacidade', icon: Shield },
]
```

- [ ] **Step 2: Inicializar `activeSection` a partir da query string**

Em `app/pages/configuracoes/index.vue:225` substituir:

```typescript
const activeSection = ref('visual')
```

por:

```typescript
const route = useRoute()
const validSectionIds = sections.map(s => s.id)
const initialSection = typeof route.query.section === 'string' && validSectionIds.includes(route.query.section)
  ? route.query.section
  : 'visual'
const activeSection = ref(initialSection)
```

- [ ] **Step 3: Renderizar `SettingsBulkImport` (import antecipado — componente criado na Task 7)**

Em `app/pages/configuracoes/index.vue:8` adicionar import:

```typescript
import SettingsBulkImport from '../../components/settings/SettingsBulkImport.vue'
```

Após o bloco `SettingsTemplates` (que fica dentro do `<Transition>`, ao lado dos outros `v-else-if`), adicionar:

```vue
<!-- Múltiplos Cadastros -->
<SettingsBulkImport v-else-if="activeSection === 'multiplos-cadastros'" />
```

- [ ] **Step 4: Verificar manualmente**

Run: `npm run dev`, acessar `http://localhost:3000/configuracoes?section=multiplos-cadastros`
Expected: sidebar mostra "Múltiplos Cadastros" ativo (vai dar erro de componente não encontrado até a Task 7 terminar — normal nesta task, componente será criado a seguir. Se quiser validar isoladamente, crie um `SettingsBulkImport.vue` vazio temporário com `<template><div>WIP</div></template>` e apague antes do commit da Task 7).

- [ ] **Step 5: Commit**

```bash
git add app/pages/configuracoes/index.vue
git commit -m "feat: seção Múltiplos Cadastros em Configurações"
```

---

## Task 7: `SettingsBulkImport.vue` (cards de Cliente/Catálogo)

**Files:**
- Create: `app/components/settings/SettingsBulkImport.vue`
- Test: `tests/SettingsBulkImport.spec.ts`

**Interfaces:**
- Consumes: `BulkImportModal.vue` (criado na Task 8 — este componente já referencia o import; a Task 8 completa a implementação. Rode os testes desta task depois da Task 8, ou crie um stub mínimo de `BulkImportModal.vue` pra este teste passar isoladamente e complete-o na Task 8).
- Produces: nenhuma interface pública além do componente em si (sem props/emits — seção autocontida).

- [ ] **Step 1: Escrever teste (falhando)**

```typescript
// tests/SettingsBulkImport.spec.ts
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import SettingsBulkImport from '../app/components/settings/SettingsBulkImport.vue'

describe('SettingsBulkImport', () => {
  it('renderiza cards de Clientes e Catálogo com link de modelo CSV', async () => {
    const wrapper = await mountSuspended(SettingsBulkImport)
    const links = wrapper.findAll('a')
    const hrefs = links.map(l => l.attributes('href'))

    expect(wrapper.text()).toContain('Clientes')
    expect(wrapper.text()).toContain('Catálogo')
    expect(hrefs).toContain('/templates/modelo-clientes.csv')
    expect(hrefs).toContain('/templates/modelo-catalogo.csv')
  })

  it('abre o modal com type="client" ao clicar em Processar no card de Clientes', async () => {
    const wrapper = await mountSuspended(SettingsBulkImport)
    const buttons = wrapper.findAll('button').filter(b => b.text().includes('Processar'))
    await buttons[0]!.trigger('click')

    const modal = wrapper.findComponent({ name: 'BulkImportModal' })
    expect(modal.props('open')).toBe(true)
    expect(modal.props('type')).toBe('client')
  })
})
```

- [ ] **Step 2: Rodar teste, confirmar falha**

Run: `npx vitest run tests/SettingsBulkImport.spec.ts`
Expected: FAIL — componente não existe.

- [ ] **Step 3: Implementar `SettingsBulkImport.vue`**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Download } from 'lucide-vue-next'
import BulkImportModal from './BulkImportModal.vue'

const modalOpen = ref(false)
const modalType = ref<'client' | 'catalog'>('client')

function openModal(type: 'client' | 'catalog') {
  modalType.value = type
  modalOpen.value = true
}

const cards = [
  {
    type: 'client' as const,
    title: 'Clientes',
    description: 'Importe vários clientes de uma vez a partir de um arquivo CSV.',
    templateHref: '/templates/modelo-clientes.csv'
  },
  {
    type: 'catalog' as const,
    title: 'Catálogo',
    description: 'Importe vários produtos ou serviços de uma vez a partir de um arquivo CSV.',
    templateHref: '/templates/modelo-catalogo.csv'
  }
]
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div
        v-for="card in cards"
        :key="card.type"
        class="rounded-[0.75rem] border border-gray-200 dark:border-gray-800 p-6 space-y-4"
      >
        <div>
          <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-wide">{{ card.title }}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ card.description }}</p>
        </div>

        <a
          :href="card.templateHref"
          download
          class="inline-flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:underline"
        >
          <Download class="w-4 h-4" />
          Baixar modelo CSV
        </a>

        <BaseButton type="button" class="w-full" @click="openModal(card.type)">
          <Upload class="w-4 h-4 mr-2" />
          Processar importação
        </BaseButton>
      </div>
    </div>

    <BulkImportModal v-model:open="modalOpen" :type="modalType" />
  </div>
</template>
```

- [ ] **Step 4: Rodar teste, confirmar sucesso (após stub mínimo de `BulkImportModal.vue` se a Task 8 ainda não rodou)**

Se `BulkImportModal.vue` ainda não existe, criar stub temporário só pra este teste passar:

```vue
<!-- app/components/settings/BulkImportModal.vue (stub temporário, será substituído na Task 8) -->
<script setup lang="ts">
defineProps<{ open: boolean; type: 'client' | 'catalog' }>()
defineEmits<{ (e: 'update:open', v: boolean): void }>()
</script>
<template><div /></template>
```

Run: `npx vitest run tests/SettingsBulkImport.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/components/settings/SettingsBulkImport.vue app/components/settings/BulkImportModal.vue tests/SettingsBulkImport.spec.ts
git commit -m "feat: cards de importação em massa em Configurações"
```

---

## Task 8: `BulkImportModal.vue` — upload, preview, processamento em lote, resumo

**Files:**
- Modify: `app/components/settings/BulkImportModal.vue` (substituir o stub da Task 7 pela implementação real)
- Test: `tests/BulkImportModal.spec.ts`

**Interfaces:**
- Consumes: `BaseDialog` (`app/components/ui/BaseDialog.vue`, props `open`/`title`/`description`/`size`, slots `default`+`footer`), `BaseButton`, `validateImportFile`/`parseCsvText`/`chunkRows`/`MAX_ROWS`/`BATCH_SIZE` de `app/composables/useBulkImportParser.ts` (Task 4), `useAlerts().notify` (já existe), `$fetch`.
- Produces: props `{ open: boolean; type: 'client' | 'catalog' }`, emit `update:open(boolean)`. Endpoint alvo: `/api/clients/bulk` quando `type === 'client'`, `/api/catalog/bulk` quando `type === 'catalog'`.

- [ ] **Step 1: Escrever teste (falhando)**

```typescript
// tests/BulkImportModal.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import BulkImportModal from '../app/components/settings/BulkImportModal.vue'

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('$fetch', () => fetchMock)

function makeCsvFile(content: string): File {
  return new File([content], 'clientes.csv', { type: 'text/csv' })
}

async function selectFile(wrapper: any, file: File) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [file] })
  await input.trigger('change')
}

describe('BulkImportModal', () => {
  beforeEach(() => fetchMock.mockReset())

  it('mostra preview com contagem de linhas após upload de CSV válido', async () => {
    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'client' } })
    await selectFile(wrapper, makeCsvFile('name,email\nJoão,joao@email.com\nMaria,maria@email.com'))

    expect(wrapper.text()).toContain('2')
    expect(wrapper.text()).toContain('João')
    expect(wrapper.text()).toContain('Maria')
  })

  it('rejeita arquivo maior que 2MB sem entrar no preview', async () => {
    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'client' } })
    const bigContent = 'name,email\n' + 'a,a@email.com\n'.repeat(200_000) // > 2MB
    await selectFile(wrapper, makeCsvFile(bigContent))

    expect(wrapper.text()).toMatch(/2\s*mb/i)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('processa em lotes, atualiza contador de progresso e mostra resumo final', async () => {
    fetchMock
      .mockResolvedValueOnce({ results: [{ index: 0, status: 'created' }, { index: 1, status: 'skipped', message: 'E-mail já cadastrado' }] })

    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'client' } })
    await selectFile(wrapper, makeCsvFile('name,email\nJoão,joao@email.com\nMaria,maria@email.com'))

    const processButton = wrapper.findAll('button').find(b => b.text().includes('Processar'))
    await processButton!.trigger('click')
    await wrapper.vm.$nextTick()
    await Promise.resolve() // flush do await dentro do handler

    expect(fetchMock).toHaveBeenCalledWith('/api/clients/bulk', expect.objectContaining({
      method: 'POST',
      body: { rows: expect.arrayContaining([expect.objectContaining({ name: 'João' })]) }
    }))
    expect(wrapper.text()).toContain('1') // 1 criado
    expect(wrapper.text()).toContain('E-mail já cadastrado')
  })

  it('usa endpoint /api/catalog/bulk quando type="catalog"', async () => {
    fetchMock.mockResolvedValueOnce({ results: [{ index: 0, status: 'created' }] })

    const wrapper = await mountSuspended(BulkImportModal, { props: { open: true, type: 'catalog' } })
    await selectFile(wrapper, makeCsvFile('type,name,price\nproduct,Item,10'))

    const processButton = wrapper.findAll('button').find(b => b.text().includes('Processar'))
    await processButton!.trigger('click')
    await Promise.resolve()

    expect(fetchMock).toHaveBeenCalledWith('/api/catalog/bulk', expect.anything())
  })
})
```

- [ ] **Step 2: Rodar teste, confirmar falha**

Run: `npx vitest run tests/BulkImportModal.spec.ts`
Expected: FAIL — stub atual não tem input de arquivo nem lógica.

- [ ] **Step 3: Implementar `BulkImportModal.vue`**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadCloud } from 'lucide-vue-next'
import {
  validateImportFile,
  parseCsvText,
  chunkRows,
  MAX_ROWS,
  BATCH_SIZE
} from '../../composables/useBulkImportParser'

const props = defineProps<{ open: boolean; type: 'client' | 'catalog' }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

const { notify } = useAlerts()

type Step = 'idle' | 'preview' | 'processing' | 'done'
type RowResult = { index: number; status: 'created' | 'skipped' | 'error'; message?: string }

const step = ref<Step>('idle')
const fileError = ref<string | null>(null)
const rows = ref<Record<string, string>[]>([])
const processedCount = ref(0)
const results = ref<RowResult[]>([])

const endpoint = computed(() => props.type === 'client' ? '/api/clients/bulk' : '/api/catalog/bulk')
const title = computed(() => props.type === 'client' ? 'Importar Clientes' : 'Importar Catálogo')

const summary = computed(() => ({
  created: results.value.filter(r => r.status === 'created').length,
  skipped: results.value.filter(r => r.status === 'skipped').length,
  errors: results.value.filter(r => r.status === 'error').length
}))

function reset() {
  step.value = 'idle'
  fileError.value = null
  rows.value = []
  processedCount.value = 0
  results.value = []
}

function close() {
  emit('update:open', false)
  reset()
}

async function onFileChange(event: Event) {
  fileError.value = null
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const error = validateImportFile(file)
  if (error) {
    fileError.value = error
    return
  }

  const text = await file.text()
  const parsed = parseCsvText(text)

  if (parsed.length === 0) {
    fileError.value = 'CSV vazio ou sem linhas de dados'
    return
  }
  if (parsed.length > MAX_ROWS) {
    fileError.value = `Arquivo excede ${MAX_ROWS} linhas, divida em arquivos menores`
    return
  }

  rows.value = parsed
  step.value = 'preview'
}

async function processImport() {
  step.value = 'processing'
  processedCount.value = 0
  results.value = []

  const batches = chunkRows(rows.value, BATCH_SIZE)
  let offset = 0

  for (const batch of batches) {
    try {
      const response = await $fetch<{ results: RowResult[] }>(endpoint.value, {
        method: 'POST',
        body: { rows: batch }
      })
      results.value.push(...response.results.map(r => ({ ...r, index: r.index + offset })))
    } catch (e: any) {
      results.value.push(...batch.map((_, i) => ({
        index: i + offset,
        status: 'error' as const,
        message: e?.data?.statusMessage || 'Falha ao processar lote'
      })))
    }
    processedCount.value += batch.length
    offset += batch.length
  }

  step.value = 'done'
}
</script>

<template>
  <BaseDialog :open="open" @update:open="(v) => v ? emit('update:open', true) : close()" :title="title" size="lg">
    <div v-if="step === 'idle'" class="space-y-4">
      <label class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-[0.75rem] p-10 cursor-pointer">
        <UploadCloud class="w-8 h-8 text-gray-400" />
        <span class="text-sm font-bold text-gray-600 dark:text-gray-300">Clique para selecionar um arquivo CSV</span>
        <input type="file" accept=".csv" class="hidden" @change="onFileChange">
      </label>
      <p v-if="fileError" class="text-sm font-bold text-red-600">{{ fileError }}</p>
    </div>

    <div v-else-if="step === 'preview'" class="space-y-4">
      <p class="text-sm font-bold text-gray-700 dark:text-gray-300">{{ rows.length }} registro(s) encontrado(s)</p>
      <div class="overflow-x-auto max-h-64 border border-gray-100 dark:border-gray-800 rounded-[0.75rem]">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th v-for="key in Object.keys(rows[0] || {})" :key="key" class="text-left px-3 py-2 font-black uppercase text-xs">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in rows" :key="i" class="border-t border-gray-100 dark:border-gray-800">
              <td v-for="key in Object.keys(row)" :key="key" class="px-3 py-2">{{ row[key] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="step === 'processing'" class="space-y-4 text-center py-10">
      <p class="text-lg font-black">Processando {{ processedCount }} de {{ rows.length }}</p>
    </div>

    <div v-else-if="step === 'done'" class="space-y-4">
      <div class="grid grid-cols-3 gap-4 text-center">
        <div><p class="text-2xl font-black">{{ summary.created }}</p><p class="text-xs uppercase text-gray-500">Criados</p></div>
        <div><p class="text-2xl font-black">{{ summary.skipped }}</p><p class="text-xs uppercase text-gray-500">Ignorados</p></div>
        <div><p class="text-2xl font-black">{{ summary.errors }}</p><p class="text-xs uppercase text-gray-500">Erros</p></div>
      </div>
      <ul v-if="summary.errors > 0" class="text-sm space-y-1 max-h-48 overflow-y-auto">
        <li v-for="r in results.filter(r => r.status === 'error')" :key="r.index" class="text-red-600">
          Linha {{ r.index + 1 }}: {{ r.message }}
        </li>
      </ul>
    </div>

    <template #footer>
      <BaseButton v-if="step === 'preview'" type="button" @click="processImport">Processar</BaseButton>
      <BaseButton v-if="step === 'done'" type="button" @click="close">Concluir</BaseButton>
    </template>
  </BaseDialog>
</template>
```

- [ ] **Step 4: Rodar teste, confirmar sucesso**

Run: `npx vitest run tests/BulkImportModal.spec.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Rodar teste de `SettingsBulkImport` de novo (agora com o modal real, não o stub)**

Run: `npx vitest run tests/SettingsBulkImport.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/components/settings/BulkImportModal.vue tests/BulkImportModal.spec.ts
git commit -m "feat: modal de upload, preview e processamento de importação em massa"
```

---

## Task 9: CTA "Importar em massa" nas telas de Clientes e Catálogo

**Files:**
- Modify: `app/pages/clientes/index.vue`
- Modify: `app/pages/catalogo/index.vue`

**Interfaces:**
- Consumes: `navigateTo` (Nuxt global).
- Produces: nenhuma — mudança visual/navegação isolada, sem estado novo compartilhado com outras tasks.

Sem teste automatizado dedicado: as duas páginas não têm suíte de testes hoje (verificado — nenhum arquivo em `tests/` referencia `pages/clientes/index` ou `pages/catalogo/index`), e a mudança é um botão que só chama `navigateTo` com uma URL fixa. Adicionar cobertura de página exigiria montar toda a página (com seus `useFetch`/composables), desproporcional a uma navegação de uma linha. Validar manualmente no Step 3.

- [ ] **Step 1: Adicionar botão em `app/pages/clientes/index.vue`**

Em `app/pages/clientes/index.vue:4`, adicionar `Upload` ao import de ícones existente:

```typescript
import { Search, Plus, Pencil, Trash2, RefreshCcw, MapPin, Mail, Phone, ExternalLink, MoreVertical, Upload } from 'lucide-vue-next'
```

Em `app/pages/clientes/index.vue:176-179`, envolver o botão existente e adicionar o novo dentro do slot do `PageHeader`:

```vue
<PageHeader title="Seus Clientes" subtitle="Gerencie seus contatos e acelere seus orçamentos.">
  <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    <BaseButton
      type="button"
      variant="outline"
      class="w-full sm:w-auto"
      @click="navigateTo('/configuracoes?section=multiplos-cadastros')"
    >
      <Upload class="w-4 h-4 mr-2" />
      Importar em massa
    </BaseButton>
    <BaseButton data-tour="clientes-novo-btn" @click="openModal()" class="w-full sm:w-auto shadow-2xl shadow-blue-100">
      <!-- conteúdo original do botão "Novo Cliente" permanece aqui -->
    </BaseButton>
  </div>
</PageHeader>
```

(Manter o conteúdo interno original do `BaseButton` de "Novo Cliente" — só envolver os dois botões numa `div` com `flex gap-2` e adicionar o botão novo antes dele.)

- [ ] **Step 2: Adicionar botão em `app/pages/catalogo/index.vue`**

Em `app/pages/catalogo/index.vue:5`, adicionar `Upload` ao import de ícones existente:

```typescript
import { Plus, Search, Image, Pencil, Trash2, Sparkles, RefreshCcw, Package, ShoppingBag, HelpCircle, MoreVertical, Upload } from 'lucide-vue-next'
```

Em `app/pages/catalogo/index.vue:75-78`, mesmo padrão:

```vue
<PageHeader title="Seu Catálogo" subtitle="Unifique seus produtos e serviços em um só lugar.">
  <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
    <BaseButton
      type="button"
      variant="outline"
      class="w-full sm:w-auto"
      @click="navigateTo('/configuracoes?section=multiplos-cadastros')"
    >
      <Upload class="w-4 h-4 mr-2" />
      Importar em massa
    </BaseButton>
    <BaseButton data-tour="catalogo-novo-item-btn" @click="openModal()" class="w-full sm:w-auto shadow-2xl shadow-blue-100">
      <!-- conteúdo original do botão "Novo Item" permanece aqui -->
    </BaseButton>
  </div>
</PageHeader>
```

- [ ] **Step 3: Verificar manualmente**

Run: `npm run dev`, acessar `/clientes` e `/catalogo`, clicar em "Importar em massa" em cada uma.
Expected: navega para `/configuracoes?section=multiplos-cadastros` com a seção "Múltiplos Cadastros" já ativa.

- [ ] **Step 4: Commit**

```bash
git add app/pages/clientes/index.vue app/pages/catalogo/index.vue
git commit -m "feat: CTA de importação em massa nas telas de Clientes e Catálogo"
```

---

## Task 10: Suíte completa e verificação final

**Files:** nenhum arquivo novo — task de verificação.

- [ ] **Step 1: Rodar toda a suíte de testes**

Run: `npm test`
Expected: todos os testes (novos e existentes) PASS.

- [ ] **Step 2: Rodar build**

Run: `npm run build`
Expected: build sem erros de tipo/compilação (confere principalmente os novos arquivos `.vue`/`.ts`).

- [ ] **Step 3: Checklist manual de fluxo completo**

1. `/clientes` → "Importar em massa" → cai em Configurações com seção certa.
2. Baixar modelo CSV de clientes, editar localmente adicionando 2-3 linhas (uma com email duplicado de um cliente já existente, uma inválida sem nome).
3. Subir o CSV editado → preview mostra as linhas.
4. Clicar "Processar" → contador avança → resumo mostra criados/ignorados/erros corretos.
5. Repetir os passos 1-4 pra Catálogo.

- [ ] **Step 4: Commit final (se houver ajustes da verificação)**

```bash
git add -A
git commit -m "chore: ajustes finais de verificação da importação em massa"
```
