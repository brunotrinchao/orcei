# OrçaFreela Implementation Plan: Edição de Propostas

**Objetivo:** Permitir que o freelancer edite propostas que ainda não foram aceitas.

**Arquitetura:** Reaproveitamento da lógica de criação com suporte a ID existente e método PUT.

---

### Task 1: Backend de Atualização [DONE]

**Arquivos:**
- Create: `server/api/proposals/[id].put.ts`
- Modify: `server/services/ProposalService.ts`

- [x] **Step 1: Implementar `ProposalService.update`**
Lógica para atualizar os campos e recalcular os totais com base no novo snapshot de itens.

- [x] **Step 2: Criar endpoint PUT**
Proteger a rota para garantir que apenas o dono da proposta (`profileId`) possa editar e apenas se `status != 'accepted'`.

---

### Task 2: UI de Edição [DONE]

**Arquivos:**
- Create: `app/pages/dashboard/proposals/[id].vue`
- Modify: `app/pages/dashboard/proposals/index.vue`

- [x] **Step 1: Criar página de edição**
Reaproveitar (ou refatorar para componente) o formulário de `new.vue`.
Carregar dados da proposta via `useFetch` no `onMounted`.

- [x] **Step 2: Adicionar botão de "Editar" na listagem**
Adicionar ícone de lápis na lista de propostas para redirecionar para `/dashboard/proposals/[id]`.

---

### Task 3: Validação e Feedback [DONE]

- [x] **Step 1: Feedback visual**
Exibir toasts de sucesso/erro ao salvar alterações.

- [x] **Step 2: Prevenção de edição de aceitas**
Garantir que a UI não mostre o botão de editar se a proposta já foi concluída.
