import { Schema, model } from 'mongoose'

const clientSchema = new Schema({
  profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true },
  taxId: String,
  // E-mail e telefone: pelo menos um dos dois é exigido na validação da API
  // (server/utils/validate.ts::validateClient) — não obrigatórios individualmente
  // no schema pra permitir cadastro rápido só com um dos contatos.
  email: String,
  phone: String,
  isWhatsapp: { type: Boolean, default: false },
  avatar: String,
  // Endereço completo é opcional no cadastro inicial (lead rápido) — pode ser
  // completado depois em Clientes. Ver validateClient: se algum campo do
  // endereço for preenchido, todos passam a ser exigidos (evita meio-registro).
  address: {
    street: String,
    number: String,
    neighborhood: String,
    city: String,
    state: String,
    zip: String
  },
  notes: String,
  // Data-limite de retenção deste registro (CPF/CNPJ/endereço), se aplicável.
  // Sem valor definido = retido enquanto a conta do profileId estiver ativa.
  retentionUntil: { type: Date, default: null }
}, { timestamps: true })

// Ensure a user doesn't have duplicate emails for clients if needed, 
// but usually, it's fine per profile.
clientSchema.index({ profileId: 1, email: 1 })

export const Client = model('Client', clientSchema)
