import { createError } from 'h3'
import { PlatformSettings } from '../models/PlatformSettings'
import { Profile } from '../models/Profile'

export type CreditAction = 'proposalSuggest' | 'catalogSuggest' | 'clientExtract' | 'generate' | 'analyzeReport' | 'proposalSend'

const DEFAULT_COSTS: Record<CreditAction, number> = {
  proposalSuggest: 1,
  catalogSuggest: 1,
  clientExtract: 1,
  generate: 1,
  analyzeReport: 1,
  proposalSend: 1
}

let cachedCosts: Record<CreditAction, number> | null = null
let cachedCostsExpiry = 0
let cachedInitialCredits: number | null = null
let cachedInitialCreditsExpiry = 0
const CACHE_TTL = 30 * 1000 // 30 seconds

export function clearSettingsCache() {
  cachedCosts = null
  cachedCostsExpiry = 0
  cachedInitialCredits = null
  cachedInitialCreditsExpiry = 0
}

const isTest = process.env.NODE_ENV === 'test' || !!process.env.VITEST

export async function getCreditCosts(): Promise<Record<CreditAction, number>> {
  const now = Date.now()
  if (!isTest && cachedCosts && now < cachedCostsExpiry) {
    return cachedCosts
  }

  const settings = await PlatformSettings.findOne({}).lean()
  cachedCosts = { ...DEFAULT_COSTS, ...((settings as any)?.creditCosts || {}) }
  cachedCostsExpiry = now + CACHE_TTL
  return cachedCosts
}

export async function getActionCost(action: CreditAction): Promise<number> {
  const costs = await getCreditCosts()
  return costs[action] ?? DEFAULT_COSTS[action]
}

const DEFAULT_INITIAL_CREDITS = 1

/** Créditos concedidos a um novo usuário no cadastro (configurável pelo admin). */
export async function getInitialCredits(): Promise<number> {
  const now = Date.now()
  if (!isTest && cachedInitialCredits !== null && now < cachedInitialCreditsExpiry) {
    return cachedInitialCredits
  }

  const settings = await PlatformSettings.findOne({}).lean()
  const value = (settings as any)?.initialCredits
  cachedInitialCredits = Number.isFinite(value) ? value : DEFAULT_INITIAL_CREDITS
  cachedInitialCreditsExpiry = now + CACHE_TTL
  return cachedInitialCredits
}

export function requireCreditBalance(profile: { creditsBalance: number }, cost: number, isAdmin: boolean, errorMessage: string) {
  if (isAdmin || cost === 0) return
  if (profile.creditsBalance < cost) {
    throw createError({ statusCode: 402, statusMessage: errorMessage })
  }
}

/** Débito atômico pós-sucesso. custo=0 mantém aiUsage (se houver) mas pula débito de saldo. */
export async function chargeCredit(
  profileId: string,
  cost: number,
  isAdmin: boolean,
  opts: { aiUsageField?: string; errorMessage: string; session?: any }
) {
  if (isAdmin) return

  if (cost === 0) {
    if (opts.aiUsageField) {
      await Profile.findByIdAndUpdate(profileId, { $inc: { [opts.aiUsageField]: 1 } }, { session: opts.session })
    }
    return
  }

  const incFields: Record<string, number> = { creditsBalance: -cost, creditsUsed: cost }
  if (opts.aiUsageField) incFields[opts.aiUsageField] = 1

  const updated = await Profile.findOneAndUpdate(
    { _id: profileId, creditsBalance: { $gte: cost } },
    { $inc: incFields },
    { new: true, session: opts.session }
  )
  if (!updated) {
    throw createError({ statusCode: 402, statusMessage: opts.errorMessage })
  }
}

export function sanitizeCreditCosts(input: any): Record<CreditAction, number> {
  const result = { ...DEFAULT_COSTS }
  for (const key of Object.keys(DEFAULT_COSTS) as CreditAction[]) {
    const num = Number(input?.[key])
    if (Number.isFinite(num) && num >= 0) result[key] = Math.floor(num)
  }
  return result
}

export function sanitizeInitialCredits(input: any): number {
  const num = Number(input)
  if (Number.isFinite(num) && num >= 0) return Math.floor(num)
  return DEFAULT_INITIAL_CREDITS
}
