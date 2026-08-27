import { z } from 'zod'

export const ClientInfoSchema = z.object({
  name: z.string().min(1, 'Nome não pode ser vazio'),
  email: z.string().email().nullable().optional().catch(null),
  phone: z.string().nullable().optional().catch(null),
  segment: z.string().nullable().optional().catch(null),
  companySize: z.string().nullable().optional().catch(null)
})

export type ClientInfoParsed = z.infer<typeof ClientInfoSchema>

export const ExtractedClientSchema = z.object({
  name: z.string().catch(''),
  email: z.string().nullable().optional().catch(null),
  phone: z.string().nullable().optional().catch(null),
  taxId: z.string().nullable().optional().catch(null),
  segment: z.string().nullable().optional().catch(null),
  companySize: z.string().nullable().optional().catch(null),
  address: z.object({
    street: z.string().nullable().optional().catch(null),
    number: z.string().nullable().optional().catch(null),
    neighborhood: z.string().nullable().optional().catch(null),
    city: z.string().nullable().optional().catch(null),
    state: z.string().nullable().optional().catch(null),
    zip: z.string().nullable().optional().catch(null)
  }).nullable().optional().catch(null),
  notes: z.string().nullable().optional().catch(null)
}).nullable().optional().catch(null)

export type ExtractedClientParsed = z.infer<typeof ExtractedClientSchema>

export const SuggestedProposalItemSchema = z.object({
  source: z.enum(['catalog', 'new']).catch('new'),
  name: z.string().min(1, 'Nome do item é obrigatório'),
  description: z.string().catch(''),
  price: z.number().nonnegative('Preço deve ser não negativo').catch(0),
  unit: z.string().catch('UN'),
  quantity: z.number().positive('Quantidade deve ser positiva').catch(1),
  price_rationale: z.string().optional()
})

export const SuggestedProposalSchema = z.object({
  reasoning: z.string().catch(''),
  clients: z.array(ExtractedClientSchema).catch([]),
  client: ExtractedClientSchema,
  items: z.array(SuggestedProposalItemSchema).catch([])
})

export type SuggestedProposalParsed = z.infer<typeof SuggestedProposalSchema>

