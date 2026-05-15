# Spec: Marco 1 - Fundação, UI Kit Radix e Expansão de Perfil

**Data:** 2026-05-14
**Status:** Em Revisão
**Prioridade:** Alta

## 1. Objetivo
Estabelecer base técnica para expansão do Orcei: design system Radix Vue, expansão de dados cadastrais e correção de logout.

## 2. Arquitetura e Tech Stack
- **Frontend:** Nuxt 3, Tailwind CSS.
- **UI Primitives:** Radix Vue.
- **Icons:** Lucide Vue Next.
- **Máscaras:** `v-maska`.
- **Backend:** Node.js, Mongoose.

## 3. Especificações Técnicas

### 3.1. UI Kit (app/components/ui/)
Componentes Radix embrulhados e estilizados:
- **Forms:** BaseLabel, BaseInput (máscara), BaseCheckbox, BaseSelect, BaseNumberField, BaseEditable.
- **Date & Time:** BaseRangeCalendar, BaseDateRangeField, BaseDateRangePicker.
- **Navegação:** BaseNavigationBar, BasePagination.
- **Overlay & Ação:** BaseDialog, BaseButton (solid, outline, ghost).

### 3.2. Modelo de Dados (Profile)
- **company**: `taxId` (CNPJ), `legalName` (Razão Social), `tradeName` (Nome Fantasia).
- **contact**: `phones` (Array {number, isWhatsapp}), `social` ({instagram, youtube}).
- **address**: Campos obrigatórios: `zip`, `street`, `neighborhood`, `city`, `state`.

### 3.3. Segurança e Fluxo
- **Logout**: Redirecionamento para `/` e limpeza de sessão.
- **Middleware**: Proteger `/dashboard/**` para usuários autenticados.

## 4. Requisitos de UI/UX
- **Estilo**: Minimalista moderno (Linear). Bordas arredondadas, sombras sutis, títulos `font-black`.
- **Máscaras**: CEP, Telefone e CNPJ.

## 5. Critérios de Aceite
- [ ] Componentes Radix funcionais com Lucide.
- [ ] Cadastro de perfil exige endereço completo.
- [ ] Logout redireciona corretamente.
- [ ] Middleware bloqueia acesso anônimo ao dashboard.
