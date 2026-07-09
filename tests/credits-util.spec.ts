import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../server/models/PlatformSettings', () => ({
  PlatformSettings: {
    findOne: vi.fn()
  }
}))
vi.mock('../server/models/Profile', () => ({
  Profile: {
    findOneAndUpdate: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}))

import { PlatformSettings } from '../server/models/PlatformSettings'
import { Profile } from '../server/models/Profile'
import { getActionCost, getCreditCosts, requireCreditBalance, chargeCredit, sanitizeCreditCosts, getInitialCredits, sanitizeInitialCredits } from '../server/utils/credits'

function mockSettings(creditCosts: any, extra: any = {}) {
  vi.mocked(PlatformSettings.findOne).mockReturnValue({
    lean: vi.fn().mockResolvedValue(creditCosts || Object.keys(extra).length ? { creditCosts, ...extra } : null)
  } as any)
}

describe('credits util', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCreditCosts / getActionCost', () => {
    it('retorna defaults (1) quando não há settings salvos', async () => {
      mockSettings(null)
      const costs = await getCreditCosts()
      expect(costs.analyzeReport).toBe(1)
      expect(costs.proposalSend).toBe(1)
    })

    it('mescla custo customizado com defaults', async () => {
      mockSettings({ analyzeReport: 0, proposalSend: 3 })
      const cost = await getActionCost('analyzeReport')
      expect(cost).toBe(0)
      expect(await getActionCost('proposalSend')).toBe(3)
      expect(await getActionCost('generate')).toBe(1) // default não sobrescrito
    })
  })

  describe('requireCreditBalance', () => {
    it('não lança erro se admin, mesmo com saldo zero', () => {
      expect(() => requireCreditBalance({ creditsBalance: 0 }, 2, true, 'erro')).not.toThrow()
    })

    it('não lança erro se custo é 0, mesmo sem saldo', () => {
      expect(() => requireCreditBalance({ creditsBalance: 0 }, 0, false, 'erro')).not.toThrow()
    })

    it('lança 402 se saldo insuficiente', () => {
      expect(() => requireCreditBalance({ creditsBalance: 1 }, 2, false, 'saldo insuficiente')).toThrow()
    })

    it('não lança erro se saldo suficiente', () => {
      expect(() => requireCreditBalance({ creditsBalance: 5 }, 2, false, 'erro')).not.toThrow()
    })
  })

  describe('chargeCredit', () => {
    it('admin nunca é debitado', async () => {
      await chargeCredit('prof-1', 5, true, { errorMessage: 'erro' })
      expect(Profile.findOneAndUpdate).not.toHaveBeenCalled()
      expect(Profile.findByIdAndUpdate).not.toHaveBeenCalled()
    })

    it('custo 0 não debita saldo mas incrementa aiUsage', async () => {
      await chargeCredit('prof-1', 0, false, { aiUsageField: 'aiUsage.reports', errorMessage: 'erro' })
      expect(Profile.findOneAndUpdate).not.toHaveBeenCalled()
      expect(Profile.findByIdAndUpdate).toHaveBeenCalledWith('prof-1', { $inc: { 'aiUsage.reports': 1 } }, { session: undefined })
    })

    it('custo 0 sem aiUsageField não faz nada', async () => {
      await chargeCredit('prof-1', 0, false, { errorMessage: 'erro' })
      expect(Profile.findOneAndUpdate).not.toHaveBeenCalled()
      expect(Profile.findByIdAndUpdate).not.toHaveBeenCalled()
    })

    it('custo > 0 debita atomicamente com sucesso', async () => {
      vi.mocked(Profile.findOneAndUpdate).mockResolvedValue({ _id: 'prof-1', creditsBalance: 8 } as any)
      await chargeCredit('prof-1', 2, false, { aiUsageField: 'aiUsage.reports', errorMessage: 'erro' })
      expect(Profile.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'prof-1', creditsBalance: { $gte: 2 } },
        { $inc: { creditsBalance: -2, creditsUsed: 2, 'aiUsage.reports': 1 } },
        { new: true, session: undefined }
      )
    })

    it('lança 402 se saldo insuficiente (findOneAndUpdate retorna null)', async () => {
      vi.mocked(Profile.findOneAndUpdate).mockResolvedValue(null as any)
      await expect(chargeCredit('prof-1', 2, false, { errorMessage: 'saldo insuficiente' })).rejects.toMatchObject({
        statusCode: 402
      })
    })
  })

  describe('sanitizeCreditCosts', () => {
    it('aplica defaults quando input vazio/undefined', () => {
      const result = sanitizeCreditCosts(undefined)
      expect(result).toEqual({
        proposalSuggest: 1, catalogSuggest: 1, clientExtract: 1,
        generate: 1, analyzeReport: 1, proposalSend: 1
      })
    })

    it('rejeita valores negativos, mantendo default', () => {
      const result = sanitizeCreditCosts({ analyzeReport: -5 })
      expect(result.analyzeReport).toBe(1)
    })

    it('rejeita strings não numéricas, mantendo default', () => {
      const result = sanitizeCreditCosts({ proposalSend: 'abc' })
      expect(result.proposalSend).toBe(1)
    })

    it('aceita 0 (ação gratuita)', () => {
      const result = sanitizeCreditCosts({ generate: 0 })
      expect(result.generate).toBe(0)
    })

    it('trunca valores decimais', () => {
      const result = sanitizeCreditCosts({ catalogSuggest: 2.9 })
      expect(result.catalogSuggest).toBe(2)
    })
  })

  describe('getInitialCredits', () => {
    it('retorna default (1) quando não há settings salvos', async () => {
      mockSettings(null)
      expect(await getInitialCredits()).toBe(1)
    })

    it('retorna valor customizado salvo', async () => {
      mockSettings(null, { initialCredits: 3 })
      expect(await getInitialCredits()).toBe(3)
    })

    it('aceita 0 (sem créditos grátis no cadastro)', async () => {
      mockSettings(null, { initialCredits: 0 })
      expect(await getInitialCredits()).toBe(0)
    })
  })

  describe('sanitizeInitialCredits', () => {
    it('aplica default quando input vazio/undefined', () => {
      expect(sanitizeInitialCredits(undefined)).toBe(1)
    })

    it('rejeita valor negativo, mantendo default', () => {
      expect(sanitizeInitialCredits(-5)).toBe(1)
    })

    it('rejeita string não numérica, mantendo default', () => {
      expect(sanitizeInitialCredits('abc')).toBe(1)
    })

    it('aceita 0', () => {
      expect(sanitizeInitialCredits(0)).toBe(0)
    })

    it('trunca valor decimal', () => {
      expect(sanitizeInitialCredits(2.9)).toBe(2)
    })
  })
})
