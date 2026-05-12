import { Service } from './Service'
import assert from 'assert'

async function test() {
  console.log('Testing Service model...')
  try {
    // Valid instantiation
    const service = new Service({
      freelancerId: '60d5ec49f1b2c34d3c8e8e8e',
      name: 'Logo Design',
      basePrice: 500
    })
    assert.strictEqual(service.name, 'Logo Design')
    assert.strictEqual(service.billingType, 'fixed')
    console.log('✅ Service model test passed (instantiation)')

    // Validation fail: missing required fields
    const invalidService = new Service({})
    const validationError = invalidService.validateSync()
    assert(validationError?.errors['freelancerId'], 'freelancerId should be required')
    assert(validationError?.errors['name'], 'name should be required')
    assert(validationError?.errors['basePrice'], 'basePrice should be required')
    console.log('✅ Service model test passed (validation)')

  } catch (err) {
    console.error('❌ Service model test failed')
    console.error(err)
    process.exit(1)
  }
}

test()
