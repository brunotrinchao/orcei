# Especificação: Múltiplos Cadastros (Importação em Massa via CSV) — Clientes e Catálogo

**Data:** 2026-08-03
**Status:** Aprovado
**Objetivo:** Permitir importar Clientes e itens de Catálogo em lote via upload de CSV, a partir de uma nova seção em Configurações.

## 1. Contexto

Hoje, cadastro de Cliente e Catálogo é feito um a um (`server/api/clients/index.post.ts`, `server/api/catalog/index.post.ts`, com validação em `server/utils/validate.ts`). Usuários com base de dados grande precisam de forma de importar em massa. Feature vive em Configurações, não nas telas de Cliente/Catálogo diretamente — essas telas só linkam pra lá.

## 2. Modelos de Referência

**Client** (`server/models/Client.ts`): `name` (obrigatório), `taxId`, `email`, `phone`, `isWhatsapp`, `address.{street,number,neighborhood,city,state,zip}`, `notes`. Pelo menos um de `email`/`phone` é exigido pela validação (`validateClient`). Duplicata definida por `email` já cadastrado no `profileId` (ver `ClientService.emailExists`).

**CatalogItem** (`server/models/CatalogItem.ts`): `type` (obrigatório, enum `CatalogItemType.PRODUCT|SERVICE`), `name` (obrigatório), `description`, `price` (obrigatório), `unit` (default `UN`), `sku`. Duplicata definida por `sku` já cadastrado no `profileId` (campo existe mas não há checagem de unicidade hoje — esta feature introduz a checagem, só no fluxo de importação).

## 3. Navegação / Entrada

- `app/pages/clientes/index.vue` e `app/pages/catalogo/index.vue`: adicionar botão "Importar em massa" no header da página (ao lado do botão de criar), navegando via `navigateTo('/configuracoes?section=multiplos-cadastros')`.
- `app/pages/configuracoes/index.vue`: no mount, ler `route.query.section`; se bater com um `id` de `sections`, setar `activeSection` inicial com esse valor (fallback continua `'visual'`).
- Novo item em `sections`: `{ id: 'multiplos-cadastros', label: 'Múltiplos Cadastros', icon: Upload }`.

## 4. Componente `SettingsBulkImport.vue`

Renderizado quando `activeSection === 'multiplos-cadastros'`, seguindo padrão dos demais `SettingsX.vue` (recebe/emite via props simples, sem lógica de perfil).

Conteúdo: 2 cards lado a lado (empilha no mobile), um por tipo de cadastro (`client`, `catalog`):
- Título + descrição curta do que será importado
- Link "Baixar modelo CSV" → arquivo estático (`/templates/modelo-clientes.csv`, `/templates/modelo-catalogo.csv`), header + 1 linha de exemplo com todos os campos aceitos
- Botão "Processar importação" → abre `BulkImportModal` com `type` correspondente

### Templates CSV (arquivos estáticos em `public/templates/`)

`modelo-clientes.csv`:
```
name,email,phone,isWhatsapp,taxId,street,number,neighborhood,city,state,zip,notes
João da Silva,joao@email.com,11999999999,true,123.456.789-00,Rua das Flores,100,Centro,São Paulo,SP,01000-000,Cliente indicado por parceiro
```

`modelo-catalogo.csv`:
```
type,name,description,price,unit,sku
product,Camiseta Básica,Camiseta 100% algodão,49.90,UN,CAM-001
```

## 5. `BulkImportModal.vue`

Modal reutilizável (usa `BaseDialog`), prop `type: 'client' | 'catalog'`. Estados internos: `idle` (dropzone) → `preview` (lista parseada) → `processing` (progresso) → `done` (resumo).

**Constantes:** `MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024` (2MB), `MAX_ROWS = 1000`, `BATCH_SIZE = 25`.

1. **Upload (`idle`):** dropzone/input `accept=".csv"`. Ao selecionar arquivo: validar extensão e `file.size <= MAX_FILE_SIZE_BYTES` (senão notify de erro e permanece em `idle`).
2. **Parse (`idle` → `preview`):** usar `papaparse` (`Papa.parse(file, { header: true, skipEmptyLines: true })`) client-side. Se `results.data.length > MAX_ROWS`, erro "Arquivo excede 1000 linhas, divida em arquivos menores" e volta pra `idle`. Se `0` linhas, erro "CSV vazio ou sem linhas de dados".
   - Mostrar tabela de preview com as colunas do CSV e contagem total de linhas detectadas.
3. **Processar (`preview` → `processing`):** ao clicar "Processar", desabilita botão, mostra `Processando {processedCount} de {total}`. Envia as linhas em lotes de `BATCH_SIZE` sequencialmente para `POST /api/{clients|catalog}/bulk`, aguardando cada lote antes do próximo, incrementando `processedCount` pelo tamanho do lote resolvido.
4. **Resumo (`processing` → `done`):** agrega resultados de todos os lotes: `{ created, skipped, errors }`. Lista expansível mostrando, por linha com erro, o número da linha + mensagem. Botão "Concluir" fecha modal e dispara refresh da lista (evento `imported`, componente pai da tela que invocou re-busca dados se estiver montada — na prática, tela de Configurações não lista clientes/catálogo, então é só fechamento; se usuário quiser ver o resultado vai em Clientes/Catálogo normalmente).

## 6. Endpoints Bulk

`server/api/clients/bulk.post.ts` e `server/api/catalog/bulk.post.ts`, mesmo padrão de auth dos `index.post.ts` existentes (sessão + `ProfileService.getByUserId`).

**Request:** `{ rows: Array<Record<string, any>> }`. Rejeitar (`400`) se `rows.length === 0` ou `rows.length > 25` (mesmo limite de lote do frontend, evita abuso via chamada direta à API).

**Processamento por linha** (sequencial, dentro do mesmo request):
- Client: `validateClient(row)` → se inválido, `{ status: 'error', message }`. Senão, checar `ClientService.emailExists` (se `row.email` presente) → se existe, `{ status: 'skipped', message: 'E-mail já cadastrado' }`. Senão `ClientService.create({ ...row, profileId })` → `{ status: 'created' }`.
- Catalog: `validateCatalogItem(row)` → se inválido, `{ status: 'error', message }`. Senão, se `row.sku` presente, checar existência de item com mesmo `sku` no `profileId` (nova query simples via `CatalogItem.findOne`, não requer método novo em service — pode ir direto ou via `CatalogService`) → se existe, `{ status: 'skipped', message: 'SKU já cadastrado' }`. Senão `CatalogService.create({ ...row, profileId })` → `{ status: 'created' }`.

**Response:** `{ results: Array<{ index: number, status: 'created' | 'skipped' | 'error', message?: string }> }` — `index` é a posição da linha dentro do lote recebido (frontend re-mapeia pro número de linha global somando offset do lote).

Conversão de tipos: valores de CSV chegam como string (`"true"`, `"49.90"`). Endpoint bulk faz coerção antes de validar: `isWhatsapp` (`'true'/'1'` → boolean), `price` (`Number(...)`, erro se `NaN`).

## 7. Nova dependência

`papaparse` (+ `@types/papaparse` em dev) — parse de CSV client-side. Sem parse de CSV no backend (endpoint recebe JSON já parseado).

## 8. Testes

- Unit: coerção de tipos do bulk endpoint (`isWhatsapp`, `price`), validação de `rows.length` fora do limite.
- Integração: `POST /api/clients/bulk` e `POST /api/catalog/bulk` — caso feliz (criação), duplicata (skip), linha inválida (error), mistura dos três num mesmo lote.
- Componente: `BulkImportModal` — parse de CSV válido gera preview correto; arquivo > 2MB rejeitado antes do parse; contagem de progresso avança por lote.

## 9. Fora de escopo

- Atualização (upsert) de registros existentes via importação — duplicata sempre é `skipped`, nunca atualiza.
- Importação de outros tipos de cadastro além de Cliente/Catálogo.
- Desfazer importação (rollback em lote).
