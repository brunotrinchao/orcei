import mongoose from 'mongoose'
import { CatalogItem } from '../models/CatalogItem'

// Define the legacy Service schema locally since it was deleted
const serviceSchema = new mongoose.Schema({
  profileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true }
}, { strict: false })

export async function migrateServicesToCatalog() {
  console.log('Starting migration: Services -> CatalogItems')
  
  // Use a temporary model to access the 'services' collection
  const LegacyService = mongoose.models.Service || mongoose.model('Service', serviceSchema)
  
  const services = await LegacyService.find().exec()
  console.log(`Found ${services.length} services to migrate.`)

  let migratedCount = 0
  for (const service of services) {
    // Check if already migrated (optional, but good for idempotency)
    const existing = await CatalogItem.findOne({ 
      profileId: service.profileId,
      name: service.name,
      type: 'service'
    })

    if (!existing) {
      await CatalogItem.create({
        profileId: service.profileId,
        type: 'service',
        name: service.name,
        description: service.description,
        price: service.price,
        unit: 'UN' // Default unit
      })
      migratedCount++
    }
  }

  console.log(`Migration completed. ${migratedCount} items migrated.`)
}
