import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { Profile } from '../server/models/Profile.ts'
import { Proposal } from '../server/models/Proposal.ts'

dotenv.config()

async function check() {
  await mongoose.connect(process.env.MONGODB_URI)
  const profiles = await Profile.find({})
  const proposalsCount = await Proposal.countDocuments({})
  
  console.log('--- DB CHECK ---')
  console.log('Total Profiles:', profiles.length)
  profiles.forEach(p => console.log(`- Email: ${p.email}, UserId: ${p.userId}, ID: ${p._id}`))
  console.log('Total Proposals:', proposalsCount)
  
  process.exit(0)
}

check()
