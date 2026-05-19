import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { Profile } from '../server/models/Profile.ts'
import { Client } from '../server/models/Client.ts'
import { CatalogItem } from '../server/models/CatalogItem.ts'
import { Proposal } from '../server/models/Proposal.ts'
import { Counter } from '../server/models/Counter.ts'
import { ProposalHistory } from '../server/models/ProposalHistory.ts'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI não encontrada no .env')
  process.exit(1)
}

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Conectado ao MongoDB para limpeza...')

    const testEmail = 'brunotrinchao@gmail.com' 
    let profile = await Profile.findOne({ email: testEmail })

    if (!profile) {
      console.log(`Perfil ${testEmail} não encontrado. Nada para limpar.`)
      process.exit(0)
    }

    const profileId = profile._id
    console.log(`Limpando dados para o Perfil: ${profile.email}`)

    const results = await Promise.all([
      Client.deleteMany({ profileId }),
      CatalogItem.deleteMany({ profileId }),
      Proposal.deleteMany({ profileId }),
      Counter.deleteMany({ profileId }),
      ProposalHistory.deleteMany({ proposalId: { $in: await Proposal.find({ profileId }).distinct('_id') } })
    ])

    console.log('✅ Limpeza concluída com sucesso:')
    console.log(`- Clientes removidos: ${results[0].deletedCount}`)
    console.log(`- Itens de catálogo removidos: ${results[1].deletedCount}`)
    console.log(`- Orçamentos removidos: ${results[2].deletedCount}`)
    console.log(`- Contadores resetados: ${results[3].deletedCount}`)
    console.log(`- Registros de histórico removidos: ${results[4].deletedCount}`)

    process.exit(0)
  } catch (err) {
    console.error('Erro na limpeza:', err)
    process.exit(1)
  }
}

cleanup()
