import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { Profile } from '../server/models/Profile.ts'

dotenv.config()

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI)
  
  const email = 'brunotrinchao@gmail.com'
  console.log(`Buscando perfil para ${email}...`)
  
  // Usar updateOne para bypassar a validação de campos obrigatórios no save() 
  // já que o perfil pode estar incompleto no banco.
  const result = await Profile.updateOne(
    { email },
    { 
      $set: { 
        stripeSubscriptionId: null,
        subscriptionPlan: 'free' 
      } 
    }
  )
  
  if (result.matchedCount > 0) {
    console.log('Perfil localizado e dados de assinatura resetados com sucesso.')
  } else {
    console.log('Perfil não encontrado.')
  }
  
  process.exit(0)
}

fix()
