import { ProfileService } from '../../services/ProfileService'
import { ProposalService } from '../../services/ProposalService'

function validateProposal(body: any) {
  const errors: { field: string; message: string }[] = []

  if (!body?.title?.trim()) {
    errors.push({ field: 'title', message: 'Título da proposta é obrigatório' })
  }

  if (!body.client?.name?.trim()) {
    errors.push({ field: 'client.name', message: 'Nome do cliente é obrigatório' })
  }

  if (!body.client?.email?.trim()) {
    errors.push({ field: 'client.email', message: 'E-mail do cliente é obrigatório' })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'Adicione pelo menos um item à proposta' })
  } else {
    body.items.forEach((item: any, i: number) => {
      if (!item.name?.trim()) {
        errors.push({ field: `items.${i}.name`, message: `Item ${i + 1}: nome é obrigatório` })
      }
      if (item.price == null || item.price < 0) {
        errors.push({ field: `items.${i}.price`, message: `Item ${i + 1}: preço inválido` })
      }
      if (!item.quantity || item.quantity < 1) {
        errors.push({ field: `items.${i}.quantity`, message: `Item ${i + 1}: quantidade deve ser ao menos 1` })
      }
    })
  }

  return errors
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const profile = await ProfileService.getByUserId((session.user as any).id)
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Profile not found' })

  const body = await readBody(event)

  const errors = validateProposal(body)
  if (errors.length > 0) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Dados inválidos',
      data: { errors }
    })
  }

  return await ProposalService.create({
    ...body,
    profileId: profile._id
  })
})
