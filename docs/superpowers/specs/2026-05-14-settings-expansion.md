# Especificação: Expansão de Configurações e Identidade Visual

**Data:** 2026-05-14
**Status:** Aprovado
**Objetivo:** Adicionar funcionalidade de upload de logo, configuração de validade padrão e reorganização da página de configurações.

## 1. Alterações no Modelo (Backend)
- **Profile.ts:**
  - Adicionar `defaultValidityDays: { type: Number, default: 7 }`.
- **API (PUT /api/profile):**
  - Garantir que o campo `defaultValidityDays` e `brandConfig.logoUrl` sejam persistidos.

## 2. Interface (Frontend - settings.vue)
- **Organização:** Layout em 3 cards principais (`rounded-2xl`, `bg-white`, `border-gray-100`).
- **Upload de Logo:**
  - Componente personalizado que aceita imagem.
  - Processamento no cliente: Resize para 120x120px usando HTML5 Canvas.
  - Armazenamento em Base64 no campo `brandConfig.logoUrl`.
- **Preferências:** Input numérico para validade padrão.

## 3. Lógica de Negócio
- O valor de `defaultValidityDays` deve ser recuperado ao criar uma nova proposta para preencher metadados iniciais (opcional, mas recomendado para consistência).

## 4. Design Mobile-First
- Cards ocupam largura total no mobile.
- Inputs com espaçamento generoso.
- Botão "Salvar" fixo ou no final da página com estado de loading.
