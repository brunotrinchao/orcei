import { ProfileService } from '../../services/ProfileService'
import { ProposalService } from '../../services/ProposalService'

export default defineEventHandler(async (event) => {
  const sessionPromise = getUserSession(event)
  const bodyPromise = readBody(event)

  const session = await sessionPromise
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404 })

  const id = getRouterParam(event, 'id')
  const body = await bodyPromise

  const ALLOWED_FIELDS = ['title', 'client', 'items', 'upsellItems', 'paymentConfig', 'contractText', 'termsAndConditions', 'status', 'sendMethod', 'notes', 'executionDate', 'totals']
  const safeBody = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k))) as any

  if (safeBody.executionDate !== undefined) {
    if (!safeBody.executionDate || String(safeBody.executionDate).trim() === '') {
      safeBody.executionDate = null
    } else {
      const d = new Date(safeBody.executionDate)
      safeBody.executionDate = isNaN(d.getTime()) ? null : d
    }
  }

  // Sanitizar items e upsellItems
  if (Array.isArray(safeBody.items)) {
    safeBody.items = safeBody.items.map((item: any) => ({
      catalogItemId: item.catalogItemId || undefined,
      name: String(item.name || '').trim(),
      description: item.description ? String(item.description).trim() : '',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      isUpsell: false
    }))
  }

  if (Array.isArray(safeBody.upsellItems)) {
    safeBody.upsellItems = safeBody.upsellItems.map((item: any) => ({
      catalogItemId: item.catalogItemId || undefined,
      name: String(item.name || '').trim(),
      description: item.description ? String(item.description).trim() : '',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      isUpsell: true
    }))
  }

  const isAdmin = (session.user as any).role === 'admin'
  try {
    const proposal = await ProposalService.update(id!, profile._id as any, safeBody, isAdmin)
    if (!proposal) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: 'Orçamento não encontrado ou já aceito' 
      })
    }

    return proposal
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Error updating proposal:', err)
    throw createError({
      statusCode: 400,
      statusMessage: err.message || 'Erro ao atualizar orçamento.'
    })
  }
})
