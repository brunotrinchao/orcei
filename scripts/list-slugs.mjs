import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
dotenv.config()

async function check() {
  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db
  console.log(`Conectado ao banco: ${db.databaseName}`)
  const proposals = await db.collection('proposals').find({}, { projection: { slug: 1, code: 1 } }).toArray()
  
  console.log('--- PROPOSALS LIST ---')
  proposals.forEach(p => console.log(`Slug: ${p.slug}, Code: ${p.code}`))
  
  process.exit(0)
}

check()
