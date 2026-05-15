# Spec: Marco 2 - Catálogo Unificado, Gestão de Clientes e Cloudinary

**Data:** 2026-05-14
**Status:** Em Revisão
**Prioridade:** Alta

## 1. Objetivo
Transformar a gestão de ativos do Orcei: unificar Produtos e Serviços em um Catálogo com suporte a imagens via Cloudinary e criar um módulo completo para Cadastro de Clientes.

## 2. Arquitetura e Tech Stack
- **Images:** Cloudinary (via `@nuxtjs/cloudinary`).
- **Frontend:** Nuxt 3, Radix Vue, Lucide Vue Next.
- **Backend:** Node.js (Nitro), Mongoose (MongoDB).
- **IA:** Gemini (descrições enriquecidas para catálogo).

## 3. Especificações Técnicas

### 3.1. Cloudinary Integration
- Substituir o armazenamento Base64 por URLs do Cloudinary.
- **Configuração:** Registrar API Key e Cloud Name no `runtimeConfig`.
- **Upload:** Implementar componente de upload que envia para o Cloudinary e retorna a URL segura.

### 3.2. Catálogo Unificado (`CatalogItem`)
Refatoração/Renomeação da coleção `Service`.
- **Schema:**
  - `type`: `'product' | 'service'` (required).
  - `name`: String (required).
  - `description`: String.
  - `price`: Number (optional).
  - `unit`: `'UN' | 'KG' | 'CM' | 'ML' | 'H' | 'DIA' | 'MES'` (default: 'UN').
  - `sku`: String (optional).
  - `imageUrl`: String (Cloudinary URL).
- **IA Generation:** Prompt atualizado para considerar o `type` e `unit`.

### 3.3. Gestão de Clientes (`Client`)
Nova coleção dedicada.
- **Schema:**
  - `profileId`: ObjectId (ref: Profile).
  - `name`: String (required).
  - `taxId`: String (CPF/CNPJ).
  - `email`: String (required).
  - `phone`: `{ number: String, isWhatsapp: Boolean }`.
  - `address`: `{ zip, street, number, neighborhood, city, state }`.
  - `notes`: String.

### 3.4. UI Kit (Expansão)
- `BaseSelect`: Para tipos de item e unidades.
- `BaseDialog`: Substituir modais legados.
- `BasePagination`: Para as listas de catálogo e clientes.
- `BaseSearch`: Campo de busca com ícone integrado.

## 4. Estratégia de Migração
1. Criar novo modelo `CatalogItem`.
2. Script de migração para mover dados de `Service` para `CatalogItem` definindo `type: 'service'`.
3. Deletar coleção `Service` após validação.

## 5. Critérios de Aceite
- [ ] Cadastro de cliente com endereço completo e flag de WhatsApp.
- [ ] Catálogo permite cadastrar produtos com imagem carregada no Cloudinary.
- [ ] Listas de Clientes e Catálogo possuem busca funcional e paginação.
- [ ] Descrição via IA funciona para produtos e serviços corretamente.
