# Design Spec: Integração Google Agenda e Drive

**Data:** 2026-05-20
**Status:** Validado
**Autor:** Gemini CLI (Senior Developer Mode)

## 1. Objetivo
Automatizar a criação de eventos no Google Agenda e o arquivamento de orçamentos no Google Drive quando uma proposta é aceita pelo cliente.

## 2. Requisitos de Usuário
- O usuário deve poder conectar sua conta Google de forma opcional.
- Ao aceitar um orçamento com "Data de Execução" preenchida, um evento deve surgir na agenda.
- O evento deve conter a localização do cliente e o PDF da proposta como anexo real (clipe).
- Os arquivos devem ser organizados em uma pasta chamada `[APP_NAME]` no Drive do usuário.

## 3. Arquitetura Técnica

### 3.1. Modelo de Dados (MongoDB)

#### Profile (`server/models/Profile.ts`)
Adicionar campo `googleIntegration`:
```typescript
googleIntegration: {
  email: String,
  accessToken: String,
  refreshToken: String,
  expiryDate: Number,
  driveFolderId: String
}
```

#### Proposal (`server/models/Proposal.ts`)
Adicionar campo `executionDate`:
```typescript
executionDate: { type: Date, default: null }
```

### 3.2. Fluxo de Integração (OAuth 2.0)
- **Scopes Necessários**: 
  - `https://www.googleapis.com/auth/calendar.events` (Gerenciar eventos)
  - `https://www.googleapis.com/auth/drive.file` (Criar arquivos na pasta do App)
  - `https://www.googleapis.com/auth/userinfo.email` (Identificar a conta)
- **Acesso Offline**: Utilizar `access_type: 'offline'` e `prompt: 'consent'` para obter o `refreshToken`.

### 3.3. Novos Componentes e Rotas

#### Backend
- **`server/services/GoogleService.ts`**:
  - `getAuthClient(profileId)`: Retorna cliente autenticado com auto-refresh de token.
  - `ensureFolder(auth)`: Verifica/cria pasta `APP_NAME` no Drive.
  - `uploadPdf(auth, folderId, fileName, buffer)`: Sobe PDF para o Drive.
  - `createEvent(auth, data)`: Cria evento com anexo e localização.
- **`server/api/integrations/google/`**:
  - `connect.get.ts`: Inicia fluxo OAuth.
  - `callback.get.ts`: Recebe código e salva tokens.
  - `disconnect.post.ts`: Remove integração.

#### Frontend
- **`app/pages/dashboard/settings.vue`**: Adicionar aba "Integrações".
- **`app/components/ProposalForm.vue`**: Adicionar campo `executionDate` condicionado a `profile.googleIntegration`.

### 3.4. Fluxo de Aceite (`ProposalService.acceptProposal`)
1. Gera o Buffer do PDF (Puppeteer).
2. Se `googleIntegration` ativa e `executionDate` preenchida:
   - Sobe PDF para o Drive do usuário.
   - Cria evento no Calendar com o link do arquivo no Drive como anexo.
   - Localização = Endereço do cliente formatado.

## 4. Tratamento de Erros
- Se o `refreshToken` for revogado, marcar integração como "Erro" e notificar o usuário nas configurações.
- Se a criação do evento falhar, logar o erro e permitir que o aceite da proposta continue (a venda é prioritária).

## 5. Próximos Passos
1. Implementar `GoogleService.ts`.
2. Criar endpoints de conexão/callback.
3. Atualizar UI de Configurações e Formulário.
4. Integrar lógica no `ProposalService`.
