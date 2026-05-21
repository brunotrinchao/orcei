import { Proposal } from '../models/Proposal'
import { Profile } from '../models/Profile'
import { Counter } from '../models/Counter'
import { ProposalHistory } from '../models/ProposalHistory'
import { nanoid } from 'nanoid'
import { sendProposalEmail } from '../utils/email'
import { GoogleService } from './GoogleService'
import { generateProposalPdfBuffer } from '../utils/pdf'

import { ProposalStatus, PaymentMethod, SendMethod, SubscriptionStatus } from '../../types/enums'

export const ProposalService = {
  async listByProfile(profileId: string) {
    return await Proposal.find({ profileId }).sort({ createdAt: -1 })
  },

  async getById(id: string, profileId: string) {
    return await Proposal.findOne({ _id: id, profileId })
  },

  async getBySlug(slug: string) {
    // Populamos o profileId apenas com campos necessários para evitar vazamento de tokens sensíveis
    return await Proposal.findOne({ slug }).populate('profileId', 'name avatar brandConfig address company contact email')
  },

  async logHistory(proposalId: any, action: string, type: 'system' | 'email' = 'system', details?: any) {
    try {
      await ProposalHistory.create({
        proposalId,
        type,
        action,
        details,
        timestamp: new Date()
      })
    } catch (err) {
      console.error('[ProposalService] Failed to log history:', err)
    }
  },

  async getHistory(proposalId: string) {
    return await ProposalHistory.find({ proposalId }).sort({ timestamp: -1 })
  },

  async create(data: any) {
    const slug = nanoid(10)
    const token = nanoid(20)
    const totals = this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)

    // Numeração Sequencial
    const currentYear = new Date().getFullYear()
    const counter = await Counter.findOneAndUpdate(
      { profileId: data.profileId, year: currentYear },
      { $inc: { lastSequence: 1 } },
      { upsert: true, returnDocument: 'after' }
    )

    const sequenceNumber = counter.lastSequence
    const code = `#ORC-${currentYear}-${String(sequenceNumber).padStart(3, '0')}`

    const profile = await Profile.findById(data.profileId)
    const validityDays = profile?.defaultValidityDays || 7
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validityDays)

    // Se criar já como 'created' e sendMethod for 'auto', consome crédito e envia
    let lastEmailId = undefined
    if (data.status === ProposalStatus.CREATED) {
      await this.consumeCredit(data.profileId)

      if (data.sendMethod !== SendMethod.MANUAL) {
        if (profile && data.client?.email) {
          const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${slug}?t=${token}`
          const emailRes = await sendProposalEmail(
            data.client.email,
            data.client.name,
            proposalUrl,
            profile.name
          )
          if (emailRes) lastEmailId = emailRes.id
        }
      }
    }

    const proposal = await Proposal.create({
      ...data,
      title: data.title?.trim() || code,
      slug,
      token,
      sequenceNumber,
      code,
      totals,
      expiresAt,
      lastEmailId
    })

    await this.logHistory(proposal._id, ProposalStatus.CREATED)
    if (lastEmailId) {
      await this.logHistory(proposal._id, ProposalStatus.SENT, 'email', { emailId: lastEmailId })
    }

    return proposal
  },

  async update(id: string, profileId: string, data: any) {
    const oldProposal = await Proposal.findOne({ _id: id, profileId })
    if (!oldProposal) return null
    if (oldProposal.status === ProposalStatus.ACCEPTED) return null

    let lastEmailId = oldProposal.lastEmailId
    let emailSent = false

    // Consome crédito se mudar de draft para created/pending/etc
    if (oldProposal.status === ProposalStatus.DRAFT && data.status !== ProposalStatus.DRAFT) {
      await this.consumeCredit(profileId)

      // Se mudou para 'created' e não for manual, envia e-mail
      if (data.status === ProposalStatus.CREATED && data.sendMethod !== SendMethod.MANUAL) {
        const profile = await Profile.findById(profileId)
        if (profile && data.client?.email) {
          const proposalUrl = `${process.env.PUBLIC_URL || 'https://orcei.com.br'}/p/${oldProposal.slug}?t=${oldProposal.token}`
          const emailRes = await sendProposalEmail(
            data.client.email,
            data.client.name,
            proposalUrl,
            profile.name
          )
          if (emailRes) {
            lastEmailId = emailRes.id
            emailSent = true
          }
        }
      }
    }

    const totals = this.calculateTotals(data.items, data.totals?.additional || 0, data.totals?.discount || 0, data.paymentConfig)
    const updated = await Proposal.findOneAndUpdate(
      { _id: id, profileId },
      { ...data, totals, lastEmailId },
      { returnDocument: 'after' }
    )

    if (updated && emailSent) {
      await this.logHistory(updated._id, ProposalStatus.SENT, 'email', { emailId: lastEmailId })
    }

    return updated
  },

  async consumeCredit(profileId: string) {
    const profile = await Profile.findById(profileId)
    if (!profile) return

    const hasActiveSubscription =
      profile.subscriptionPlan !== 'free' &&
      (profile.subscriptionStatus === SubscriptionStatus.ACTIVE || profile.subscriptionStatus === SubscriptionStatus.TRIALING)

    if (!hasActiveSubscription && profile.creditsUsed >= profile.creditsBalance) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Créditos insuficientes. Faça um upgrade do seu plano.'
      })
    }

    await Profile.findByIdAndUpdate(profileId, { $inc: { creditsUsed: 1 } })
  },

  async updateStatus(slug: string, status: string) {
    const updated = await Proposal.findOneAndUpdate({ slug }, { status }, { returnDocument: 'after' })
    if (updated) {
      // Map system status updates to history actions
      const actionMap: Record<string, string> = {
        [ProposalStatus.CREATED]: ProposalStatus.CREATED,
        [ProposalStatus.ACCEPTED]: ProposalStatus.ACCEPTED,
        [ProposalStatus.EXPIRED]: 'declined',
        [ProposalStatus.VIEWED]: ProposalStatus.VIEWED,
        [ProposalStatus.PENDING]: ProposalStatus.PENDING
      }
      await this.logHistory(updated._id, actionMap[status] || status)
    }
    return updated
  },

  async acceptProposal(slug: string, paymentMethod: PaymentMethod) {
    const proposal = await Proposal.findOne({ slug }).populate('profileId')
    if (!proposal) return null
    
    // Calculate final totals based on client choice
    const totals = this.calculateTotals(proposal.items, proposal.totals?.additional || 0, proposal.totals?.discount || 0, {
      ...(proposal.paymentConfig || {}),
      method: paymentMethod
    })

    const updated = await Proposal.findOneAndUpdate(
      { slug }, 
      { 
        status: ProposalStatus.ACCEPTED,
        'paymentConfig.method': paymentMethod,
        totals
      }, 
      { returnDocument: 'after' }
    )

    if (updated) {
      await this.logHistory(updated._id, ProposalStatus.ACCEPTED, 'system', { paymentMethod })

      // Automação Google
      const profile: any = proposal.profileId
      if (profile?.googleIntegration?.refreshToken) {
        try {
          const auth = GoogleService.getAuthClient(profile)
          
          // 1. Garantir pasta e Upload PDF
          const folderId = profile.googleIntegration.driveFolderId || await GoogleService.ensureFolder(auth, profile)
          if (!profile.googleIntegration.driveFolderId) {
            await Profile.findByIdAndUpdate(profile._id, { 'googleIntegration.driveFolderId': folderId })
          }

          const pdfBuffer = await generateProposalPdfBuffer(updated, profile)
          const fileName = `Proposta-${updated.code}-${updated.client.name}.pdf`
          const driveFile = await GoogleService.uploadPdf(auth, folderId, fileName, pdfBuffer)

          // 2. Criar evento no Calendar se tiver executionDate
          if (updated.executionDate) {
            await GoogleService.createEvent(auth, {
              summary: `Execução: ${updated.title} (${updated.client.name})`,
              location: profile.address?.city || '',
              description: `Orçamento: ${updated.code}\nCliente: ${updated.client.name}\nValor: R$ ${updated.totals.final.toLocaleString('pt-BR')}\n\nPDF: ${driveFile.webViewLink}`,
              start: updated.executionDate,
              fileId: driveFile.id,
              webViewLink: driveFile.webViewLink,
              fileName
            })
          }
          console.log(`[ProposalService] Automação Google concluída para: ${updated.code}`)
        } catch (error) {
          console.error(`[ProposalService] Falha na automação Google para ${updated.code}:`, error)
        }
      }
    }

    return updated
  },

  async declineProposal(slug: string) {
    const updated = await Proposal.findOneAndUpdate({ slug }, { status: ProposalStatus.EXPIRED }, { returnDocument: 'after' })
    if (updated) {
      await this.logHistory(updated._id, 'declined')
    }
    return updated
  },

  async requestChanges(slug: string, notes?: string) {
    const updated = await Proposal.findOneAndUpdate({ slug }, { status: ProposalStatus.PENDING }, { returnDocument: 'after' })
    if (updated) {
      await this.logHistory(updated._id, ProposalStatus.VIEWED, 'system', { notes })
    }
    return updated
  },

  calculateTotals(items: any[], additional: number = 0, discount: number = 0, paymentConfig: any = {}) {
    const subtotal = items.reduce((acc, item) => {
      const price = item.price || 0
      const qty = item.quantity || 1
      return acc + (price * qty)
    }, 0)

    const baseTotal = subtotal + (additional || 0) - (discount || 0)
    let final = baseTotal
    let cashDiscountValue = 0

    if (paymentConfig.method === PaymentMethod.CASH && paymentConfig.cashDiscount > 0) {
      cashDiscountValue = baseTotal * (paymentConfig.cashDiscount / 100)
      final = baseTotal - cashDiscountValue
    }

    return {
      subtotal,
      additional,
      discount,
      final
    }
  }
}

