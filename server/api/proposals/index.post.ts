import { ProfileService } from '../../services/ProfileService'
import { ProposalService } from '../../services/ProposalService'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateProposal(body: any) {
  const errors: { field: string; message: string }[] = []

  if (!body.client?.name?.trim()) {
    errors.push({ field: 'client.name', message: 'Nome do cliente é obrigatório' })
  }

  const email = body.client?.email?.trim()
  if (!email) {
    errors.push({ field: 'client.email', message: 'E-mail do cliente é obrigatório' })
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push({ field: 'client.email', message: 'E-mail do cliente é inválido' })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'Adicione pelo menos um item à proposta' })
  } else {
    body.items.forEach((item: any, i: number) => {
      if (!item.name?.trim()) {
        errors.push({ field: `items.${i}.name`, message: `Item ${i + 1}: nome é obrigatório` })
      }
      if (typeof item.price !== 'number' || Number.isNaN(item.price) || item.price < 0) {
        errors.push({ field: `items.${i}.price`, message: `Item ${i + 1}: preço inválido` })
      }
      if (typeof item.quantity !== 'number' || Number.isNaN(item.quantity) || item.quantity < 1) {
        errors.push({ field: `items.${i}.quantity`, message: `Item ${i + 1}: quantidade deve ser ao menos 1` })
      }
    })
  }

  return errors
}

export default defineEventHandler(async (event) => {
  const sessionPromise = getUserSession(event)
  const bodyPromise = readBody(event)

  const session = await sessionPromise
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const body = await bodyPromise

  // Sanitização de campos
  if (body.executionDate !== undefined) {
    if (!body.executionDate || String(body.executionDate).trim() === '') {
      body.executionDate = null
    } else {
      const d = new Date(body.executionDate)
      body.executionDate = isNaN(d.getTime()) ? null : d
    }
  }

  // Sanitizar items e upsellItems
  if (Array.isArray(body.items)) {
    body.items = body.items.map((item: any) => ({
      catalogItemId: item.catalogItemId || undefined,
      name: String(item.name || '').trim(),
      description: item.description ? String(item.description).trim() : '',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      isUpsell: false
    }))
  }

  if (Array.isArray(body.upsellItems)) {
    body.upsellItems = body.upsellItems.map((item: any) => ({
      catalogItemId: item.catalogItemId || undefined,
      name: String(item.name || '').trim(),
      description: item.description ? String(item.description).trim() : '',
      price: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      isUpsell: true
    }))
  }

  const errors = validateProposal(body)
  if (errors.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Dados inválidos',
      data: { errors }
    })
  }

  const isAdmin = (session.user as any).role === 'admin'
  try {
    return await ProposalService.create({
      ...body,
      profileId: profile._id
    }, isAdmin)
  } catch (err: any) {
    if (err.statusCode) throw err
    console.error('Error creating proposal:', err)
    throw createError({
      statusCode: 400,
      statusMessage: err.message || 'Erro ao criar orçamento. Verifique os dados informados.'
    })
  }
})
