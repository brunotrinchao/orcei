import { ProposalService } from '../../../services/ProposalService'
import { ProfileService } from '../../../services/ProfileService'
import { ProposalStatus } from '../../../models/Proposal'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const id = getRouterParam(event, 'id')
  const { contractText } = await readBody(event)

  if (typeof contractText !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'contractText é obrigatório' })
  }

  const proposal = await ProposalService.updateContractText(id!, profile._id as any, contractText)
  if (!proposal) {
    throw createError({ statusCode: 404, statusMessage: 'Orçamento não encontrado ou não está pendente' })
  }

  return proposal
})
