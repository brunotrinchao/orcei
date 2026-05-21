import mongoose from 'mongoose'
import * as dotenv from 'dotenv'
import { ProposalService } from '../server/services/ProposalService.ts'
import { Proposal } from '../server/models/Proposal.ts'
import { Profile } from '../server/models/Profile.ts'

// Mocking useRuntimeConfig for standalone script
global.useRuntimeConfig = () => ({
  googleClientId: process.env.NUXT_OAUTH_GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.NUXT_OAUTH_GOOGLE_CLIENT_SECRET,
  appName: process.env.APP_NAME || 'Orcei',
  public: {
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }
})

dotenv.config()

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // 1. Find a profile with Google Integration
    const profile = await Profile.findOne({ 'googleIntegration.refreshToken': { $exists: true } })
    if (!profile) {
      console.error('No profile found with Google Integration. Please connect Google in the app first.')
      process.exit(1)
    }
    console.log('Found profile:', profile.email)

    // 2. Create a dummy proposal with executionDate
    const executionDate = new Date()
    executionDate.setDate(executionDate.getDate() + 1) // Tomorrow

    const dummyProposal = await Proposal.create({
      profileId: profile._id,
      title: 'Teste Automacao Google',
      sequenceNumber: 999,
      code: '#TEST-001',
      client: {
        name: 'Cliente Teste',
        email: 'test@example.com'
      },
      slug: 'test-' + Math.random().toString(36).substring(7),
      status: 'draft',
      items: [{ name: 'Servico Teste', price: 100, quantity: 1, description: 'Descricao teste' }],
      totals: { subtotal: 100, additional: 0, discount: 0, final: 100 },
      executionDate
    })

    console.log('Created dummy proposal:', dummyProposal.code, 'Execution Date:', executionDate)

    // 3. Trigger acceptProposal
    console.log('Accepting proposal and triggering automation...')
    const updated = await ProposalService.acceptProposal(dummyProposal.slug, 'cash')

    if (updated) {
      console.log('Proposal accepted successfully.')
      console.log('Check your Google Calendar for an event tomorrow.')
      console.log('Check your Google Drive for the PDF archive.')
    } else {
      console.error('Failed to accept proposal.')
    }

    // Cleanup (optional)
    // await Proposal.deleteOne({ _id: dummyProposal._id })

  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

test()
