import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config()

async function check() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const proposal = await db.collection('proposals').findOne({ _id: new mongoose.Types.ObjectId('6a0e431de21e02a82016be0a') })
  
  if (proposal) {
    console.log('--- TARGET PROPOSAL ---')
    console.log(`Slug: ${proposal.slug}, Code: ${proposal.code}`)
  } else {
    console.log('Proposal NOT FOUND for ID: 6a0e431de21e02a82016be0a')
  }
  
  process.exit(0)
}

check()
