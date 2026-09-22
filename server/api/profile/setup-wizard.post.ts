import { z } from 'zod'
import { Profile } from '../../models/Profile'

const schema = z.object({
  company: z.object({
    taxId: z.string().optional(),
    legalName: z.string().optional(),
    tradeName: z.string().min(1, 'Informe o nome da organização para concluir o cadastro.')
  }).optional(),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional()
  }).optional(),
  contact: z.object({
    phones: z.array(z.object({
      number: z.string(),
      isWhatsapp: z.boolean()
    })).optional(),
    social: z.object({
      instagram: z.string().optional(),
      youtube: z.string().optional(),
      facebook: z.string().optional(),
      twitter: z.string().optional()
    }).optional()
  }).optional(),
  brandConfig: z.object({
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, statusMessage: 'Não autorizado' })
  }

  const body = await readBody(event)

  // Pular o wizard: grava só o timestamp, sem validar/alterar os demais dados
  // do perfil. O wizard só volta a aparecer 24h depois (ver OnboardingController).
  if (body?.skip === true) {
    const profile = await Profile.findOneAndUpdate(
      { userId: (session.user as any).id },
      { $set: { setupWizardSkippedAt: new Date() } },
      { returnDocument: 'after' }
    )
    if (!profile) {
      throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
    }
    return { success: true, skipped: true }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Dados inválidos no formulário.'
    })
  }
  const data = parsed.data

  // Blindagem: wizard completo exige ao menos o nome da organização.
  if (!data.company?.tradeName?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe o nome da organização para concluir o cadastro.'
    })
  }

  // Monta o objeto de atualização com os dados preenchidos
  const updateFields: Record<string, any> = { setupWizardCompleted: true, setupWizardSkippedAt: null }
  if (data.company) updateFields.company = data.company
  if (data.address) updateFields.address = data.address
  if (data.contact) updateFields.contact = data.contact
  if (data.brandConfig) updateFields.brandConfig = data.brandConfig

  const profile = await Profile.findOneAndUpdate(
    { userId: (session.user as any).id },
    { $set: updateFields },
    { returnDocument: 'after' }
  )

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Perfil não encontrado' })
  }

  return { success: true }
})
