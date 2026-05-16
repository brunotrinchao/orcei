export interface BrandConfig {
  logoUrl?: string
  primaryColor: string
}

export interface ProfileDTO {
  _id: string
  userId: string
  name: string
  email: string
  avatar?: string
  brandConfig: BrandConfig
  address: {
    street: string
    number?: string
    neighborhood: string
    city: string
    state: string
    zip: string
  }
  company: {
    taxId: string
    legalName: string
    tradeName: string
  }
  contact: {
    phones: Array<{
      number: string
      isWhatsapp: boolean
    }>
    social: {
      instagram?: string
      youtube?: string
    }
  }
  creditsBalance: number
  creditsUsed: number
  subscriptionPlan: 'free' | 'starter' | 'premium'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionStatus?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused' | null
  subscriptionEndsAt?: string | null
  cancelAtPeriodEnd?: boolean
  stripePriceId?: string | null
  defaultValidityDays: number
  defaultInstallments: number
  defaultCashDiscount: number
  defaultContractTemplate: string
  defaultTermsAndConditions: string
}

export interface CatalogItemDTO {
  _id: string
  profileId: string
  name: string
  description: string
  price: number
  type: 'product' | 'service'
  unit: string
  sku?: string
  imageUrl?: string
}

export type ServiceDTO = CatalogItemDTO

export interface ProposalItemDTO {
  _id?: string
  catalogItemId?: string
  name: string
  description: string
  price: number
  quantity: number
}

export interface ProposalDTO {
  _id: string
  profileId: any
  title: string
  code?: string
  sequenceNumber?: number
  token?: string
  slug: string
  status: 'draft' | 'created' | 'pending' | 'accepted' | 'expired'
  sendMethod?: 'manual' | 'auto'
  client: {
    name: string
    email: string
    phone?: string
  }
  items: ProposalItemDTO[]
  totals: {
    subtotal: number
    additional?: number
    discount: number
    final: number
  }
  paymentConfig: {
    method: 'cash' | 'credit_card'
    installments: number
    cashDiscount: number
  }
  contractText: string
  termsAndConditions: string
  expiresAt: string | Date
  createdAt: string
  updatedAt: string
}

export interface ClientDTO {
  _id: string
  profileId: string
  name: string
  taxId?: string
  email: string
  phone: string
  isWhatsapp: boolean
  address: {
    street: string
    number?: string
    neighborhood: string
    city: string
    state: string
    zip: string
  }
  notes?: string
  createdAt?: string
  updatedAt?: string
}
