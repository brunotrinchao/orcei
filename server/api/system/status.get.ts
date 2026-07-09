import { PlatformSettings } from '../../models/PlatformSettings'
import mongoose from 'mongoose'

export default defineEventHandler(async () => {
  let settings = null
  try {
    if (mongoose.connection.readyState === 1) {
      settings = await PlatformSettings.findOne({}).lean()
    }
  } catch (e) {
    console.error('[API Status] Erro ao buscar configurações:', e)
  }
  
  const config = useRuntimeConfig()
  const appName = config.appName || 'Orcei'

  return {
    maintenanceMode: settings?.maintenanceMode || false,
    systemStatus: settings?.systemStatus || { label: 'Operacional', color: 'green' },
    footerText: settings?.footerText || `© 2026 ${appName}. Todos os direitos reservados.`,
    landingPage: {
      appName,
      heroTitle: settings?.landingPage?.heroTitle || `Crie orçamentos profissionais em segundos com IA`,
      heroSubtitle: settings?.landingPage?.heroSubtitle || `A plataforma definitiva para freelancers e pequenas agências gerenciarem vendas e fecharem mais negócios.`,
      features: settings?.landingPage?.features || []
    },
    creditCosts: {
      proposalSuggest: settings?.creditCosts?.proposalSuggest ?? 1,
      catalogSuggest: settings?.creditCosts?.catalogSuggest ?? 1,
      clientExtract: settings?.creditCosts?.clientExtract ?? 1,
      generate: settings?.creditCosts?.generate ?? 1,
      analyzeReport: settings?.creditCosts?.analyzeReport ?? 1,
      proposalSend: settings?.creditCosts?.proposalSend ?? 1
    }
  }
})
