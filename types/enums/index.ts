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

export enum ProposalStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  CREATED = 'created',
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  CLICKED = 'clicked',
  BOUNCED = 'bounced',
  VIEWED = 'viewed',
  SCHEDULED = 'scheduled',
  RECEIVED = 'received',
  DELAYED = 'delayed',
  FAILED = 'failed',
  SUPPRESSED = 'suppressed'
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
