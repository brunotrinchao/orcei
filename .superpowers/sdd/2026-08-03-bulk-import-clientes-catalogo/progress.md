# SDD ledger — plan: docs/superpowers/plans/2026-08-03-bulk-import-clientes-catalogo.md

Baseline (worktree setup): npm install ok. npm test: 117/120 passed, 3 pre-existing
failures unrelated to this plan (tests/Billing.spec.ts, tests/GoogleAutomation.spec.ts,
tests/StripeWebhook.spec.ts — webhooks/billing, no relation to clients/catalog/CSV).
Not caused by this work; not in scope to fix.

- [x] Task 1: BulkImportService — coerção e processamento de linhas (Cliente) [Commits: 1f4b839, 510dc1a]
- [x] Task 2: BulkImportService.processCatalogRows + CatalogService.skuExists [Commits: 78d208e, 5323421, f406326]
- [x] Task 3: Endpoints POST /api/clients/bulk e POST /api/catalog/bulk [Commit: 0761b54]
- [x] Task 4: Dependência papaparse + composable de parsing/validação de arquivo [Commit: 100f4f8]


