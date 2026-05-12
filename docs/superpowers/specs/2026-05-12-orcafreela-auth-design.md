# Design Doc: OrçaFreela - Módulo de Autenticação e Perfil
Data: 2026-05-12
Status: Aprovado

## 1. Visão Geral
Implementação do sistema de autenticação utilizando Auth.js (anteriormente NextAuth) adaptado para Nuxt 3, com suporte a Login Social (Google) e Magic Links.

## 2. Arquitetura de Identidade
Adotaremos uma separação entre **Identidade (Auth)** e **Negócio (Perfil)**.

### Coleções Auth.js (Gerenciadas pelo Adaptador MongoDB)
- `users`: Dados básicos de conta (email, imagem, id).
- `accounts`: Vínculos com provedores (Google).
- `sessions`: Sessões ativas.
- `verificationTokens`: Tokens para Magic Links.

### Coleção de Perfil (OrçaFreela)
- Renomearemos o schema `User` atual para `Profile`.
- Cada `Profile` terá um `userId` apontando para o ID da coleção `users` do Auth.js.
- Contém: `creditsBalance`, `brandConfig`, `subscriptionPlan`, `defaultSettings`.

## 3. Fluxo de Registro
1. O usuário faz o primeiro login via Google ou Email.
2. O Auth.js cria o registro na coleção `users`.
3. Um gatilho (callback `signIn` ou `createUser`) verifica se existe um `Profile` vinculado.
4. Caso não exista, cria um novo `Profile` com os valores default (1 crédito, plano free).

## 4. Integração Nuxt
- **Biblioteca:** `authjs-nuxt`.
- **Composables:** `useAuth()` para obter sessão no frontend.
- **Server Utils:** `getServerSession(event)` para proteger rotas de API no Nitro.

## 5. Próximos Passos
1. Instalar dependências: `@auth/core`, `@auth/mongodb-adapter`, `authjs-nuxt`.
2. Renomear `server/models/User.ts` para `server/models/Profile.ts`.
3. Configurar o endpoint `/api/auth/*` no Nitro.
4. Implementar lógica de criação automática de perfil.
