import { ServiceService } from '../../services/ServiceService'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401 })

  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  // Note: O ServiceService deve validar se o serviço pertence ao profile logado
  return await ServiceService.update(id!, body)
})
