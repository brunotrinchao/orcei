import mongoose from 'mongoose'
import * as dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('MONGODB_URI não encontrada no .env')
  process.exit(1)
}

// Define schema inline to avoid TS import issues in plain node
const platformSettingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  footerText: { type: String, default: '© 2026 Orcei. Todos os direitos reservados.' },
  landingPage: {
    features: [{
      title: String,
      description: String,
      icon: String,
      enabled: { type: Boolean, default: true }
    }],
    heroTitle: { type: String },
    heroSubtitle: { type: String }
  }
}, { timestamps: true })

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema)

const currentFeatures = [
  { 
    title: 'Rapidez Total', 
    description: 'Gere descrições de serviços com IA e envie orçamentos profissionais em menos de 2 minutos.', 
    icon: 'Zap',
    enabled: true
  },
  { 
    title: 'Contratos Seguros', 
    description: 'Anexe termos e condições automaticamente e proteja seu trabalho juridicamente sem complicação.', 
    icon: 'ShieldCheck',
    enabled: true
  },
  { 
    title: 'Acompanhamento', 
    description: 'Saiba quando o cliente visualizou e receba aprovações em tempo real, direto no seu painel.', 
    icon: 'Eye',
    enabled: true
  },
  { 
    title: 'IA Integrada', 
    description: 'Deixe a inteligência artificial escrever descrições, sugerir preços e otimizar seus orçamentos.', 
    icon: 'Lightbulb',
    enabled: true
  },
  { 
    title: 'Catálogo de Serviços', 
    description: 'Cadastre seus serviços uma vez e reutilize em todos os orçamentos com um clique.', 
    icon: 'Briefcase',
    enabled: true
  },
  { 
    title: 'PDF Profissional', 
    description: 'Gere PDFs com sua marca, logo e dados da empresa prontos para enviar a qualquer cliente.', 
    icon: 'FileText',
    enabled: true
  }
]

async function seedSettings() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Conectado ao MongoDB...')

    const settings = await PlatformSettings.findOneAndUpdate(
      {}, // query
      {
        $set: {
          'landingPage.features': currentFeatures,
          'landingPage.heroTitle': 'Orçamentos que\nfecham negócios.',
          'landingPage.heroSubtitle': 'Crie orçamentos profissionais em segundos com IA, envie contratos automáticos e receba aprovações online. Simples assim.'
        }
      },
      { upsert: true, returnDocument: 'after' }
    )

    console.log('Funcionalidades da Landing Page cadastradas com sucesso!')
    console.log('Título:', settings.landingPage.heroTitle)
    console.log('Total de Recursos:', settings.landingPage.features.length)

    process.exit(0)
  } catch (err) {
    console.error('Erro ao cadastrar configurações:', err)
    process.exit(1)
  }
}

seedSettings()
