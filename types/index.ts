export interface BrandConfig {
  logoUrl?: string
  primaryColor: string
}

export interface ProfileDTO {
  _id: string
  userId: string
  name: string
  email: string
  brandConfig: BrandConfig
  creditsBalance: number
  creditsUsed: number
  subscriptionPlan: 'free' | 'starter' | 'premium'
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  defaultContractTemplate: string
  defaultTermsAndConditions: string
}

export interface ServiceDTO {
  _id: string
  profileId: string
  name: string
  description: string
  basePrice: number
  billingType: 'fixed' | 'hourly'
}

export interface ProposalItemDTO {
  serviceId?: string
  name: string
  description: string
  price: number
  quantity: number
}

export interface ProposalDTO {
  _id: string
  profileId: any
  title: string
  slug: string
  status: 'draft' | 'created' | 'pending' | 'accepted' | 'expired'
  client: {
    name: string
    email: string
    phone?: string
  }
  items: ProposalItemDTO[]
  totals: {
    subtotal: number
    discount: number
    final: number
  }
  contractText: string
  termsAndConditions: string
  createdAt: string
  updatedAt: string
}
