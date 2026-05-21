import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config()

async function check() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  const messages = await db.collection('proposalmessages').find({}).toArray()
  
  console.log('--- ALL MESSAGES ---')
  console.log('Total:', messages.length)
  messages.forEach(m => {
    console.log(`ProposalID: ${m.proposalId}, Sender: ${m.sender}, Text: ${m.text}`)
  })
  
  process.exit(0)
}

check()
