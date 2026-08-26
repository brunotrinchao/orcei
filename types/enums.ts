export enum SubscriptionPlan {
  FREE = 'free',
  CREDIT = 'credit',
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  TRIALING = 'trialing',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  UNPAID = 'unpaid',
  PAUSED = 'paused'
}

/**
 * Ciclo de Vida de uma Proposta Comercial (Proposal Status Lifecycle)
 */
export enum ProposalStatus {
  /** Rascunho: Proposta em criação/edição pelo prestador, ainda não finalizada ou disponibilizada ao cliente */
  DRAFT = 'draft',

  /** Criada: Proposta finalizada no sistema e pronta para envio ou compartilhamento */
  CREATED = 'created',

  /** Agendada: Envio automático agendado para uma data/hora futura */
  SCHEDULED = 'scheduled',

  /** Enviada: E-mail ou notificação da proposta disparado para o cliente */
  SENT = 'sent',

  /** Entregue: Proposta entregue com sucesso na caixa de entrada do cliente pelo provedor de e-mail */
  DELIVERED = 'delivered',

  /** Atrasada: Entrega do e-mail da proposta sofreu um atraso temporário na rede ou servidor */
  DELAYED = 'delayed',

  /** Devolvida (Bounce): Falha na entrega do e-mail (endereço inválido, caixa cheia ou inexistente) */
  BOUNCED = 'bounced',

  /** Suprimida: Envio bloqueado automaticamente para evitar marcado de spam devido a bounces anteriores */
  SUPPRESSED = 'suppressed',

  /** Falhou: Erro no processamento, geração ou envio da proposta */
  FAILED = 'failed',

  /** Recebida: Confirmação de recebimento registrada via webhook ou protocolo de entrega */
  RECEIVED = 'received',

  /** Aberta: Cliente abriu a notificação por e-mail da proposta */
  OPENED = 'opened',

  /** Clicada: Cliente clicou no link contido no e-mail da proposta */
  CLICKED = 'clicked',

  /** Visualizada: Cliente acessou a página pública da proposta (/p/[slug]) e visualizou seu conteúdo */
  VIEWED = 'viewed',

  /** Pendente: Proposta aguardando ação do cliente (aprovação ou recusa) dentro do prazo de validade */
  PENDING = 'pending',

  /** Aguardando Assinatura: Proposta aprovada/pendente que aguarda a assinatura eletrônica do contrato pelo cliente */
  PENDING_SIGNATURE = 'pending_signature',

  /** Em Assinatura: Cliente acessou o link do provedor de assinatura e está no processo de assinar o documento contratual */
  SIGNING = 'signing',

  /** Assinado: Documento contratual assinado digitalmente com sucesso por todas as partes */
  SIGNED = 'signed',

  /** Aceita: Proposta formalmente aprovada/aceita pelo cliente (com contrato assinado ou aceite digital) */
  ACCEPTED = 'accepted',

  /** Expirada: Prazo de validade da proposta encerrou sem a aprovação do cliente */
  EXPIRED = 'expired'
}

/**
 * Ciclo de Vida da Assinatura Eletrônica do Documento / Contrato
 */
export enum ProposalSignatureStatus {
  /** Sem Solicitação: Nenhum contrato ou documento foi submetido para assinatura eletrônica */
  NONE = 'none',

  /** Pendente / Solicitado: Solicitação de assinatura criada e enviada ao cliente (ex: via Assinafy), aguardando assinatura */
  PENDING = 'pending',

  /** Em Assinatura: Cliente acessou a plataforma de assinatura digital e iniciou o processo de assinatura do documento */
  SIGNING = 'signing',

  /** Assinado: Documento contratual assinado digitalmente com validade jurídica por todas as partes */
  SIGNED = 'signed',

  /** Cancelado / Recusado: Assinatura do documento recusada pelo cliente ou cancelada pelo prestador */
  REJECTED = 'rejected'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card'
}

export enum SendMethod {
  MANUAL = 'manual',
  AUTO = 'auto'
}

export enum DiscountType {
  PERCENT = 'percent',
  FIXED = 'fixed'
}

export enum CatalogItemType {
  PRODUCT = 'product',
  SERVICE = 'service'
}
