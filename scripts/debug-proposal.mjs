import { Proposal } from '../server/models/Proposal'
import mongoose from 'mongoose'
import * as dotenv from 'dotenv'

dotenv.config()

async function checkProposal() {
  const uri = process.env.MONGODB_URI
  const slug = 'Fuaehu-Rd-'

  if (!uri) {
    console.error('MONGODB_URI não encontrada no .env')
    return
  }

  try {
    await mongoose.connect(uri)
    console.log('Conectado ao MongoDB')

    const proposal = await Proposal.findOne({ slug })
    if (proposal) {
      console.log('Proposta encontrada:', {
        id: proposal._id,
        slug: proposal.slug,
        token: proposal.token,
        status: proposal.status
      })
    } else {
      console.log('Proposta NÃO encontrada para o slug:', slug)
    }
  } catch (err) {
    console.error('Erro:', err)
  } finally {
    await mongoose.disconnect()
  }
}

checkProposal()
