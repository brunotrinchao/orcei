# Especificação de Design: Redesign Minimalista Moderno (Mobile-First)

**Data:** 2026-05-13
**Status:** Em Revisão
**Objetivo:** Modernizar a interface do Orcei seguindo a estética "Minimalista Moderno" (estilo Linear/Apple), priorizando a experiência mobile e clareza visual.

## 1. Identidade Visual e Atmosfera

### Paleta de Cores
- **Fundo Principal:** `bg-gray-50/50` (#F9FAFB) para profundidade sutil.
- **Cards/Superfícies:** `bg-white` (#FFFFFF).
- **Ação Principal (Brand):** `bg-gray-900` (#111827) - O uso de preto/cinza escuro traz sofisticação.
- **Destaques:** `text-blue-600` (#2563EB) usado apenas para links e indicadores de status ativos.
- **Bordas:** `border-gray-100` (#F3F4F6) e `border-gray-200/50`.

### Tipografia
- **Títulos (Headings):** `font-semibold`, `tracking-tight`, `text-gray-900`.
- **Corpo:** `text-gray-600`, `text-sm` (base mobile).
- **Labels:** `text-[10px] uppercase font-bold tracking-widest text-gray-400`.

## 2. Layout e Navegação

### Estrutura de Página
- **Mobile First:** Container principal com `px-6 py-8`.
- **Navegação Inferior (Mobile):** 
  - Fixa no rodapé.
  - Efeito vidro: `bg-white/80 backdrop-blur-md`.
  - Altura: `h-16`.
  - Ícones: Estilo Outline (Stroke 1.5 ou 2).
- **Header:**
  - Logo "Orcei" à esquerda.
  - Avatar circular à direita (`w-8 h-8`).

## 3. Componentes

### Cards (Dashboard Stats)
- **Raio de Canto:** `rounded-2xl` (16px).
- **Sombra:** `shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]`.
- **Conteúdo:** Label superior em uppercase, valor central em fonte grande e semi-bold.

### Botões
- **Primário:** `bg-gray-900 text-white rounded-xl py-3 px-6 font-medium active:scale-95 transition-all`.
- **Secundário/Ghost:** `border border-gray-200 text-gray-700 bg-white rounded-xl py-3 px-6 hover:bg-gray-50`.

### Lista de Propostas (Recent Activity)
- Cards individuais em vez de tabela.
- Informações empilhadas verticalmente no mobile.
- Badge de status pequena com cantos arredondados e cores pastéis.

## 4. Experiência do Usuário (UX)

### Estados de Feedback
- **Carregamento:** Skeleton screens pulsantes acompanhando a forma dos cards.
- **Transições:** Fade-in suave ao navegar entre telas.
- **Empty States:** Ilustrações lineares mínimas + CTA central.

## 5. Próximos Passos
1. Refatorar `app/layouts/default.vue` para a nova estrutura de tab bar e grid.
2. Atualizar `app/pages/dashboard/index.vue` com os novos cards e tipografia.
3. Aplicar estilos aos componentes de lista e botões.
