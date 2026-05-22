import { PlatformSettings } from '../../models/PlatformSettings'

export default defineEventHandler(async () => {
  const settings = await PlatformSettings.findOne({}).lean()
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
    }
  }
})
