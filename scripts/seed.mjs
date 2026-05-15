import mongoose from 'mongoose'
import { faker } from '@faker-js/faker'
import * as dotenv from 'dotenv'
import { Profile } from '../server/models/Profile.ts'
import { Client } from '../server/models/Client.ts'
import { CatalogItem } from '../server/models/CatalogItem.ts'
import { Proposal } from '../server/models/Proposal.ts'
import { Counter } from '../server/models/Counter.ts'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI não encontrada no .env')
  process.exit(1)
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Conectado ao MongoDB para seeding...')

    const testEmail = 'bruno@orcei.com.br' 
    let profile = await Profile.findOne({ email: testEmail })

    if (!profile) {
      console.log('Criando perfil de teste...')
      profile = await Profile.create({
        userId: 'test-user-id-123',
        name: 'Bruno Trinchão',
        email: testEmail,
        brandConfig: { primaryColor: '#3B82F6' },
        address: {
          street: 'Av. Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zip: '01310-100'
        },
        company: {
          taxId: '00.000.000/0001-00',
          legalName: 'Bruno Consulting LTDA',
          tradeName: 'Bruno Consultoria'
        },
        contact: {
          phones: [{ number: '(11) 99999-9999', isWhatsapp: true }],
          social: { instagram: '@bruno' }
        },
        creditsBalance: 50,
        subscriptionPlan: 'premium'
      })
    }

    const profileId = profile._id

    await Client.deleteMany({ profileId })
    await CatalogItem.deleteMany({ profileId })
    await Proposal.deleteMany({ profileId })
    await Counter.deleteMany({ profileId })

    console.log('Limpando dados anteriores...')

    const clients = []
    for (let i = 0; i < 10; i++) {
      clients.push(await Client.create({
        profileId,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        isWhatsapp: true,
        address: {
          street: faker.location.streetAddress(),
          neighborhood: faker.location.secondaryAddress(),
          city: faker.location.city(),
          state: faker.location.state({ abbreviated: true }),
          zip: faker.location.zipCode('#####-###')
        }
      }))
    }
    console.log('10 Clientes criados.')

    const catalog = [
      { name: 'Consultoria Estratégica', price: 2500, type: 'service', unit: 'UN' },
      { name: 'Desenvolvimento Web', price: 5000, type: 'service', unit: 'Projeto' },
      { name: 'Gestão de Tráfego', price: 1200, type: 'service', unit: 'Mês' },
      { name: 'Design de Logotipo', price: 850, type: 'product', unit: 'UN' },
      { name: 'Suporte Técnico', price: 150, type: 'service', unit: 'Hora' }
    ]

    const catalogItems = []
    for (const item of catalog) {
      catalogItems.push(await CatalogItem.create({
        profileId,
        ...item,
        description: faker.lorem.paragraph()
      }))
    }
    console.log('5 Itens de catálogo criados.')

    console.log('Gerando 50 orçamentos ao longo de 1 ano...')
    const statuses = ['draft', 'created', 'pending', 'accepted', 'expired']
    
    for (let i = 0; i < 50; i++) {
      const client = faker.helpers.arrayElement(clients)
      const selectedItemsCount = faker.number.int({ min: 1, max: 3 })
      const items = []
      let subtotal = 0

      for (let j = 0; j < selectedItemsCount; j++) {
        const catItem = faker.helpers.arrayElement(catalogItems)
        const qty = faker.number.int({ min: 1, max: 5 })
        items.push({
          catalogItemId: catItem._id,
          name: catItem.name,
          description: catItem.description,
          price: catItem.price,
          quantity: qty
        })
        subtotal += catItem.price * qty
      }

      const status = faker.helpers.arrayElement(statuses)
      const discount = faker.number.int({ min: 0, max: 200 })
      const additional = faker.number.int({ min: 0, max: 100 })
      const final = subtotal + additional - discount
      
      const createdAt = faker.date.past({ years: 1 })
      
      await Proposal.create({
        profileId,
        title: `Projeto ${faker.commerce.productAdjective()} ${faker.commerce.product()}`,
        slug: faker.helpers.slugify(faker.commerce.productName() + '-' + i + '-' + Date.now()),
        token: faker.string.alphanumeric(12),
        code: `ORC-2026-${String(i+1).padStart(3, '0')}`,
        status,
        client: {
          name: client.name,
          email: client.email,
          phone: client.phone
        },
        items,
        totals: { subtotal, additional, discount, final },
        paymentConfig: {
          method: faker.helpers.arrayElement(['cash', 'credit_card']),
          installments: 12,
          cashDiscount: 10
        },
        createdAt
      })
    }

    console.log('50 Orçamentos criados com sucesso!')
    process.exit(0)
  } catch (err) {
    console.error('Erro no seeding:', err)
    process.exit(1)
  }
}

seed()
