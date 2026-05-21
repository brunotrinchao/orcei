import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config()

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    const db = mongoose.connection.db

    const profile = await db.collection('profiles').findOne({ 'googleIntegration.refreshToken': { $exists: true } })
    
    if (!profile) {
      console.log('STATUS: Nenhum perfil com Google conectado encontrado.')
    } else {
      console.log('STATUS: Google Conectado para:', profile.email)
      
      const proposal = await db.collection('proposals').findOne({ 
        profileId: profile._id, 
        executionDate: { $ne: null },
        status: 'accepted'
      })

      if (proposal) {
        console.log('STATUS: Proposta aceita com data encontrada:', proposal.code)
      } else {
        console.log('STATUS: Nenhuma proposta aceita com data para este perfil.')
      }
    }

  } catch (e) {
    console.error(e)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}
test()
