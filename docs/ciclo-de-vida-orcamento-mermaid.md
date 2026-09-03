# Ciclo de Vida do Orçamento — Diagramas Mermaid (Orcei)

> Base: código real (`server/services/ProposalService.ts`, endpoints, `app/utils/proposalLifecycle.ts`).
> 19 statuses em **5 fases**: Rascunho → Em andamento → Assinatura → Fechado | Falhou/Cancelado.

---

## 1. Ciclo de vida — transições + gatilhos

```mermaid
flowchart TD
    %% ---- FASE 1 ----
    subgraph F1["1 - RASCUNHO"]
        DRAFT["Rascunho (criação livre)"]
    end

    %% ---- FASE 2 ----
    subgraph F2["2 - EM ANDAMENTO"]
        CREATED["Criado"]
        SCHEDULED["Agendado"]
        SENT["Enviado"]
        DELIVERED["Entregue"]
        OPENED["Aberto"]
        CLICKED["Clicado"]
        VIEWED["Visualizado"]
        PENDING["Pendente (mensagem do cliente)"]
    end

    %% ---- FASE 3 ----
    subgraph F3["3 - ASSINATURA"]
        SIG_PENDING["Aguardando assinatura (Assinafy)"]
        SIGNING["Em assinatura"]
    end

    %% ---- FASE 4 ----
    subgraph F4["4 - FECHADO"]
        ACCEPTED["Aceito"]
        SIGNED["Assinado (aceite + contrato)"]
    end

    %% ---- FASE 5 ----
    subgraph F5["5 - FALHOU / CANCELADO"]
        EXPIRED["Expirado"]
        REJECTED["Recusado"]
        BOUNCED["Erro na entrega"]
        FAILED["Falha no envio"]
        SUPPRESSED["Suprimido"]
        DECLINED["Declinado"]
    end

    %% ---- TRANSIÇÕES ----
    DRAFT -->|"Criar e Enviar - consome crédito"| CREATED
    DRAFT -->|"Salvar rascunho - permanece"| DRAFT

    CREATED -->|"envio automático - fila SEND_EMAIL_PROPOSAL"| SENT
    CREATED -->|"envio manual - WhatsApp/link"| SENT
    CREATED -->|"agendar"| SCHEDULED
    SCHEDULED -->|"disparo"| SENT

    SENT -->|"webhook Resend email.delivered"| DELIVERED
    DELIVERED -->|"webhook email.opened"| OPENED
    DELIVERED -->|"webhook email.clicked"| CLICKED
    OPENED -->|"cliente abre pagina"| VIEWED
    CLICKED -->|"cliente abre pagina"| VIEWED
    VIEWED -->|"cliente envia mensagem"| PENDING

    PENDING -->|"cliente ACEITA - /public/accept"| ACCEPTED

    ACCEPTED -->|"auto: fila REQUEST_DIGITAL_SIGNATURE (doc + email com link)"| SIG_PENDING
    ACCEPTED -->|"fallback manual - profissional solicita"| SIG_PENDING
    SIG_PENDING -->|"cliente abre link Assinafy"| SIGNING
    SIGNING -->|"sync Assinafy doc signed"| SIGNED
    SIG_PENDING -->|"recusa assinatura"| REJECTED

    SENT -->|"erro entrega"| BOUNCED
    SENT -->|"falha servidor"| FAILED
    SENT -->|"bounces repetidos"| SUPPRESSED

    %% ---- EXPIRAÇÃO ----
    CREATED -->|"venceu expiresAt (sync lazy)"| EXPIRED
    SENT -->|"venceu"| EXPIRED
    DELIVERED -->|"venceu"| EXPIRED
    OPENED -->|"venceu"| EXPIRED
    VIEWED -->|"venceu"| EXPIRED
    PENDING -->|"venceu"| EXPIRED
    SCHEDULED -->|"venceu"| EXPIRED

    EXPIRED -->|"RENOVAR - nova validade, reabre sent"| SENT
    EXPIRED -->|"RENOVAR E REENVIAR - idem + email"| SENT

    VIEWED -->|"cliente recusa - /action decline"| DECLINED
    PENDING -->|"recusado"| DECLINED

    %% ---- TERMINAIS ----
    ACCEPTED -.->|"NÃO expira"| ACCEPTED
    SIGNED -.->|"terminal - sem editar/excluir"| SIGNED

    style DRAFT fill:#e5e7eb,stroke:#6b7280
    style CREATED fill:#dbeafe,stroke:#3b82f6
    style SCHEDULED fill:#dbeafe,stroke:#3b82f6
    style SENT fill:#dbeafe,stroke:#3b82f6
    style DELIVERED fill:#dbeafe,stroke:#3b82f6
    style OPENED fill:#dbeafe,stroke:#3b82f6
    style CLICKED fill:#dbeafe,stroke:#3b82f6
    style VIEWED fill:#dbeafe,stroke:#3b82f6
    style PENDING fill:#dbeafe,stroke:#3b82f6
    style SIG_PENDING fill:#fef3c7,stroke:#d97706
    style SIGNING fill:#fef3c7,stroke:#d97706
    style ACCEPTED fill:#d1fae5,stroke:#059669
    style SIGNED fill:#d1fae5,stroke:#059669
    style EXPIRED fill:#fee2e2,stroke:#dc2626
    style REJECTED fill:#fee2e2,stroke:#dc2626
    style BOUNCED fill:#fee2e2,stroke:#dc2626
    style FAILED fill:#fee2e2,stroke:#dc2626
    style SUPPRESSED fill:#fee2e2,stroke:#dc2626
    style DECLINED fill:#fee2e2,stroke:#dc2626
```

---

## 2. Ações permitidas por status (matriz canônica)

```mermaid
flowchart LR
    subgraph ACOES["Ações (fonte: getAllowedActions)"]
        EDIT["Editar"]
        DEL["Excluir"]
        SEND["Enviar"]
        RES["Reenviar email"]
        WA["WhatsApp"]
        LINK["Link público"]
        SIGN_REQ["Solicitar assinatura"]
        EDIT_CON["Editar contrato"]
        PDF["Baixar PDF"]
        HIST["Histórico"]
        RENEW["Renovar / Reenviar"]
    end

    DRAFT_S["Rascunho"] --> EDIT & DEL & SEND
    DRAFT_S -.->|"bloqueado"| WA & LINK & SIGN_REQ & RES

    PROG_S["Em andamento (criado até pending)"] --> EDIT & DEL & RES & WA & LINK & PDF & HIST
    PROG_S -.->|"sem assinatura antes do aceite"| SIGN_REQ

    ACC_S["Aceito"] --> WA & LINK & PDF & HIST
    ACC_S --> SIGN_REQ

    SIGNED_S["Assinado"] --> WA & LINK & PDF & HIST
    SIGNED_S -.->|"terminal"| EDIT & DEL & RES

    PEND_S["Pendente"] --> EDIT_CON & EDIT & DEL

    EXP_S["Expirado"] --> RENEW & PRINT & HIST
    EXP_S -.->|"sem reenviar simples"| RES

    style DRAFT_S fill:#e5e7eb,stroke:#6b7280
    style PROG_S fill:#dbeafe,stroke:#3b82f6
    style PEND_S fill:#dbeafe,stroke:#3b82f6
    style ACC_S fill:#d1fae5,stroke:#059669
    style SIGNED_S fill:#d1fae5,stroke:#059669
    style EXP_S fill:#fee2e2,stroke:#dc2626
```

---

## 3. Eventos do histórico por fase (agrupamento)

```mermaid
flowchart TD
    subgraph H1["Rascunho"]
        E1["created - orçamento criado"]
    end

    subgraph H2["Em andamento"]
        E2["sent - e-mail enviado (auto/manual/reenvio)"]
        E3["delivered - entregue"]
        E4["opened - aberto"]
        E5["clicked - link clicado"]
        E6["viewed - visualizado"]
        E7["pending - mensagem do cliente"]
        E8["renew - renovado"]
        E9["received - recebido pelo servidor"]
    end

    subgraph H3["Assinatura"]
        E10["signature_requested - solicitação enviada"]
        E11["uploaded - documento gerado"]
        E12["signing - em assinatura"]
    end

    subgraph H4["Fechado"]
        E13["accepted - aceito"]
        E14["signed - assinado digitalmente"]
    end

    subgraph H5["Falhou / Cancelado"]
        E15["expired - expirado"]
        E16["declined - recusado"]
        E17["bounced - erro na entrega"]
        E18["complained - spam"]
        E19["failed - falha no envio"]
        E20["rejected - assinatura recusada"]
        E21["delayed - atrasado"]
    end

    subgraph H6["Sistema (fora do ciclo)"]
        E22["google_sync - sincronizado"]
    end

    E1 --> E2 --> E3 --> E4 --> E5 --> E6 --> E7 --> E10 --> E12 --> E14
    E15 --> E16
```

---

## Notas de regra (implementadas)

1. **Aceite primeiro, assinatura depois**: `REQUEST_DIGITAL_SIGNATURE` dispara automaticamente no aceite (`acceptProposal`). Assinar antes do aceite é bloqueado (backend 422 + matriz).
2. **Expirado = status real**: sincronizado lazy em `getById`/listagem → `status: 'expired'` persistido + evento `expired` no histórico.
3. **Aceito/assinado não expira**: imunes em `syncExpiredStatus`, página `/p`, card e matriz.
4. **Renovar/Reenviar**: recalcula validade, reabre `sent`, reenvia email com o mesmo link (`slug` + `token` intactos). Modal com 3 opções (Cancelar / Renovar / Renovar e Reenviar). Expirado não tem botão "Reenviar" simples — só renovar.
5. **Data de validade** conta a partir do envio (rascunho saindo reseta `createdAt` + `expiresAt`).
6. **Histórico ordenado**: etapas de baixo para cima (mais recente no topo), ações dentro da etapa mais recente primeiro.
7. **Stepper**: falha vinda de Em andamento marca só Rascunho + Em andamento como concluídas; Assinatura/Fechado permanecem não concluídas.