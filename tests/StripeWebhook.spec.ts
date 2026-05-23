import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocking models and global functions via elevated hoisted references to guarantee correct instance testing
const { mockProfile, mockStripeEvent, mockSubscriptionsRetrieve, mockConstructEvent } = vi.hoisted(() => {
  const mockProfile = {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn()
  }
  const mockStripeEvent = {
    create: vi.fn(),
    deleteOne: vi.fn()
  }
  const mockSubscriptionsRetrieve = vi.fn()
  const mockConstructEvent = vi.fn()

  vi.stubGlobal('useStripe', () => ({
    webhooks: {
      constructEvent: mockConstructEvent
    },
    subscriptions: {
      retrieve: mockSubscriptionsRetrieve
    }
  }))

  return {
    mockProfile,
    mockStripeEvent,
    mockSubscriptionsRetrieve,
    mockConstructEvent
  }
})

vi.mock('../server/models/Profile', () => ({ Profile: mockProfile }))
vi.mock('../server/models/StripeEvent', () => ({ StripeEvent: mockStripeEvent }))

// Mock mongoose partially
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>()
  return {
    ...actual,
    default: {
      ...actual.default,
      connection: {
        readyState: 1
      },
      connect: vi.fn(),
      set: vi.fn()
    }
  }
})

vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('readRawBody', vi.fn())
vi.stubGlobal('setResponseStatus', vi.fn())
vi.stubGlobal('createError', (e: any) => {
  const err = new Error(e.statusMessage || 'Error')
  ;(err as any).statusCode = e.statusCode
  return err
})
vi.stubGlobal('defineEventHandler', (handler: any) => handler)

// Mocking Emails utils
vi.mock('../server/utils/email', () => ({
  sendPlanActivationEmail: vi.fn().mockResolvedValue({}),
  sendCreditPurchaseEmail: vi.fn().mockResolvedValue({}),
  sendPlanCancellationEmail: vi.fn().mockResolvedValue({})
}))

describe('Stripe Webhook Integration', () => {
  let handler: any

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Mutate the real reactive useRuntimeConfig instance provided by Nuxt Vitest environment
    const config = useRuntimeConfig()
    config.stripeWebhookSecret = 'whsec_mock'
    config.public.stripeStarterPriceId = 'price_starter_123'
    config.public.stripePremiumPriceId = 'price_premium_123'
    config.public.stripePriceMonthly = 'price_premium_123'
    config.public.stripePriceAnnual = 'price_annual_123'

    const module = await import('../server/api/webhooks/stripe.post')
    handler = module.default
  })

  it('should throw 400 if signature header is missing', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeader } = (global as any)
    vi.mocked(getHeader).mockReturnValue(undefined)

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'No signature'
    })
  })

  it('should throw 400 if constructEvent fails', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeader, readRawBody } = (global as any)
    vi.mocked(getHeader).mockReturnValue('invalid_sig')
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from('{}'))
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature validation failed')
    })

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Webhook Error: Signature validation failed'
    })
  })

  it('should return duplicate: true if Stripe event was already processed (Idempotency)', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeader, readRawBody } = (global as any)
    vi.mocked(getHeader).mockReturnValue('valid_sig')
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from('{}'))
    
    mockConstructEvent.mockReturnValue({
      id: 'evt_dup123',
      type: 'checkout.session.completed',
      data: { object: {} }
    })

    mockStripeEvent.create.mockRejectedValue({
      code: 11000
    })

    const result = await handler(event)
    expect(result).toEqual({ received: true, duplicate: true })
    expect(mockStripeEvent.create).toHaveBeenCalledWith({ eventId: 'evt_dup123', type: 'checkout.session.completed' })
  })

  it('should process new subscription checkout.session.completed successfully', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeader, readRawBody } = (global as any)
    vi.mocked(getHeader).mockReturnValue('valid_sig')
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from('{}'))

    mockConstructEvent.mockReturnValue({
      id: 'evt_checkout123',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_client123',
          mode: 'subscription',
          subscription: 'sub_premium123',
          metadata: {
            profileId: 'prof_client123',
            type: 'subscription'
          },
          amount_total: 9900
        }
      }
    })

    mockSubscriptionsRetrieve.mockResolvedValue({
      status: 'active',
      current_period_end: 1778873300,
      cancel_at_period_end: false,
      items: {
        data: [{ price: { id: 'price_premium_123' } }]
      }
    })

    mockStripeEvent.create.mockResolvedValue({} as any)
    mockProfile.findOneAndUpdate.mockResolvedValue({
      email: 'cliente@orcei.com',
      name: 'Cliente Premium'
    } as any)

    const result = await handler(event)
    expect(result).toEqual({ received: true })
    expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'prof_client123' },
      expect.objectContaining({
        $set: expect.objectContaining({
          subscriptionPlan: 'premium',
          subscriptionStatus: 'active',
          creditsBalance: 9999,
          stripeSubscriptionId: 'sub_premium123'
        })
      }),
      { returnDocument: 'after' }
    )
  })

  it('should process single credit purchase completed successfully', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeader, readRawBody } = (global as any)
    vi.mocked(getHeader).mockReturnValue('valid_sig')
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from('{}'))

    mockConstructEvent.mockReturnValue({
      id: 'evt_credits123',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_client123',
          mode: 'payment',
          metadata: {
            profileId: 'prof_client123',
            type: 'credits',
            tier: 'credits_5'
          },
          amount_total: 2500
        }
      }
    })

    mockStripeEvent.create.mockResolvedValue({} as any)
    mockProfile.findOneAndUpdate.mockResolvedValue({
      email: 'cliente@orcei.com',
      name: 'Cliente Avulsos',
      creditsBalance: 15
    } as any)

    const result = await handler(event)
    expect(result).toEqual({ received: true })
    expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'prof_client123' },
      expect.objectContaining({
        $inc: { creditsBalance: 5 },
        $set: { stripeCustomerId: 'cus_client123' }
      }),
      { returnDocument: 'after' }
    )
  })

  it('should preserve add-on credits during invoice.payment_succeeded (Renewal)', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeader, readRawBody } = (global as any)
    vi.mocked(getHeader).mockReturnValue('valid_sig')
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from('{}'))

    mockConstructEvent.mockReturnValue({
      id: 'evt_invoice123',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          customer: 'cus_client123',
          subscription: 'sub_starter123',
          amount_paid: 2900
        }
      }
    })

    mockSubscriptionsRetrieve.mockResolvedValue({
      status: 'active',
      current_period_end: 1778873300,
      cancel_at_period_end: false,
      items: {
        data: [{ price: { id: 'price_starter_123' } }]
      }
    })

    mockProfile.findOne.mockResolvedValue({
      stripeCustomerId: 'cus_client123',
      subscriptionPlan: 'starter',
      creditsBalance: 10,
      creditsUsed: 2
    } as any)

    mockStripeEvent.create.mockResolvedValue({} as any)
    mockProfile.findOneAndUpdate.mockResolvedValue({
      email: 'cliente@orcei.com',
      name: 'Cliente Starter',
      creditsBalance: 10
    } as any)

    const result = await handler(event)
    expect(result).toEqual({ received: true })
    
    // Verifica se findOneAndUpdate foi chamado com o saldo correto acumulado
    expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { stripeCustomerId: 'cus_client123' },
      expect.objectContaining({
        $set: expect.objectContaining({
          subscriptionPlan: 'starter',
          creditsBalance: 10, // 5 (Starter) + 5 (Add-ons preservados)
          creditsUsed: 0
        })
      }),
      { returnDocument: 'after' }
    )
  })

  it('should process customer.subscription.deleted successfully and revert to free', async () => {
    const event = { node: { req: {}, res: {} } } as any
    const { getHeader, readRawBody } = (global as any)
    vi.mocked(getHeader).mockReturnValue('valid_sig')
    vi.mocked(readRawBody).mockResolvedValue(Buffer.from('{}'))

    mockConstructEvent.mockReturnValue({
      id: 'evt_deleted123',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_client123'
        }
      }
    })

    mockProfile.findOne.mockResolvedValue({
      email: 'cliente@orcei.com',
      name: 'Cliente Ex-Starter',
      subscriptionPlan: 'starter',
      subscriptionEndsAt: new Date()
    } as any)

    mockStripeEvent.create.mockResolvedValue({} as any)
    mockProfile.findOneAndUpdate.mockResolvedValue({
      email: 'cliente@orcei.com',
      name: 'Cliente Ex-Starter'
    } as any)

    const result = await handler(event)
    expect(result).toEqual({ received: true })
    expect(mockProfile.findOneAndUpdate).toHaveBeenCalledWith(
      { stripeCustomerId: 'cus_client123' },
      expect.objectContaining({
        $set: expect.objectContaining({
          subscriptionPlan: 'free',
          subscriptionStatus: 'canceled'
        })
      }),
      { returnDocument: 'after' }
    )
  })
})
