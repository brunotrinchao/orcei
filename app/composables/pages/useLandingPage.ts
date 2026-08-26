import { computed, watchEffect } from 'vue'

export function useLandingPage() {
  const { data: systemInfo } = useFetch<any>('/api/system/status', { key: 'system-status' })

  const landing = computed(() => systemInfo.value?.landingPage || {
    heroTitle: 'Gere seu primeiro orçamento profissional grátis em 2 minutos.',
    heroSubtitle: 'Escreva do seu jeito: nossa IA organiza as especificações e monta uma proposta de orçamento impecável e contrato integrado prontos para aprovação do seu cliente. Grátis para começar!',
    features: []
  })

  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'https://orceifacil.com.br'
  const ogImageUrl = `${siteUrl}/images/landpage-banner.jpg`

  useHead({
    link: [
      {
        rel: 'preload',
        as: 'image',
        href: ogImageUrl,
        fetchpriority: 'high'
      },
      {
        rel: 'canonical',
        href: siteUrl
      }
    ],
    meta: [
      { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1' }
    ]
  })

  useSeoMeta({
    title: 'Orcei Fácil — Software de Orçamento com IA',
    ogTitle: 'Orcei Fácil — Crie Propostas Comerciais com IA em 2 Minutos',
    description: 'Software de orçamento com IA para freelancers e autônomos. Crie propostas comerciais profissionais em 2 minutos, envie por link e feche mais clientes. Grátis para começar.',
    ogDescription: 'Software de orçamento com IA para freelancers e autônomos. Crie propostas comerciais profissionais em 2 minutos, envie por link e feche mais clientes. Primeiro orçamento 100% grátis.',
    ogImage: ogImageUrl,
    ogImageWidth: '1200',
    ogImageHeight: '675',
    ogImageAlt: 'Orcei Fácil — Software de orçamento com inteligência artificial para freelancers',
    ogUrl: siteUrl,
    ogType: 'website',
    ogSiteName: 'Orcei Fácil',
    ogLocale: 'pt_BR',
    twitterCard: 'summary_large_image',
    twitterSite: '@orceifacil',
    twitterTitle: 'Orcei Fácil — Software de Orçamento com IA',
    twitterDescription: 'Crie propostas comerciais profissionais com IA em 2 minutos. Envie por link, acompanhe leitura e feche mais clientes. Primeiro orçamento grátis!',
    twitterImage: ogImageUrl,
    twitterImageAlt: 'Orcei Fácil — painel de orçamentos com inteligência artificial',
  })

  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${siteUrl}/#organization`,
              'name': 'Orcei Fácil',
              'url': siteUrl,
              'logo': {
                '@type': 'ImageObject',
                'url': `${siteUrl}/images/favicon/favicon-96x96.png`,
                'width': 96,
                'height': 96
              },
              'sameAs': [
                'https://www.instagram.com/orceifacil',
                'https://www.linkedin.com/company/orceifacil'
              ],
              'contactPoint': {
                '@type': 'ContactPoint',
                'contactType': 'customer support',
                'availableLanguage': 'Portuguese'
              }
            },
            {
              '@type': 'WebSite',
              '@id': `${siteUrl}/#website`,
              'url': siteUrl,
              'name': 'Orcei Fácil',
              'description': 'Software de orçamento com IA para freelancers e autônomos brasileiros',
              'publisher': { '@id': `${siteUrl}/#organization` },
              'inLanguage': 'pt-BR'
            },
            {
              '@type': 'WebApplication',
              '@id': `${siteUrl}/#webapp`,
              'name': 'Orcei Fácil',
              'url': siteUrl,
              'description': 'Software de orçamento com inteligência artificial para freelancers e pequenas empresas. Crie propostas comerciais profissionais em 2 minutos. Grátis para começar.',
              'applicationCategory': 'BusinessApplication',
              'operatingSystem': 'All',
              'browserRequirements': 'Requires JavaScript',
              'inLanguage': 'pt-BR',
              'offers': { '@id': `${siteUrl}/#product` },
              'featureList': [
                'Criação de orçamentos com Inteligência Artificial',
                'Envio de proposta comercial por link exclusivo',
                'Notificação em tempo real quando cliente visualiza',
                'Aprovação digital online pelo cliente',
                'PDF profissional com logo e dados da empresa',
                'Catálogo de serviços reutilizável',
                'Gestão de clientes integrada',
                'Dashboard com relatórios e métricas'
              ]
            },
            {
              '@type': 'Product',
              '@id': `${siteUrl}/#product`,
              'name': 'Orcei Fácil — Software de Orçamento com IA',
              'image': ogImageUrl,
              'description': 'Software de orçamento com IA para freelancers, autônomos e pequenas empresas. Crie propostas comerciais profissionais, envie por link e feche mais clientes.',
              'brand': { '@id': `${siteUrl}/#organization` },
              'offers': {
                '@type': 'AggregateOffer',
                'priceCurrency': 'BRL',
                'lowPrice': '0.00',
                'highPrice': '29.90',
                'offerCount': '3',
                'offers': [
                  {
                    '@type': 'Offer',
                    'name': 'Plano Gratuito',
                    'description': 'Crie seu primeiro orçamento 100% grátis, sem cartão de crédito',
                    'price': '0.00',
                    'priceCurrency': 'BRL',
                    'url': siteUrl,
                    'availability': 'https://schema.org/InStock'
                  },
                  {
                    '@type': 'Offer',
                    'name': 'Plano Avulso — Créditos de IA',
                    'description': 'Pacote de créditos para usar a IA sem mensalidade',
                    'price': '15.00',
                    'priceCurrency': 'BRL',
                    'url': `${siteUrl}/planos`,
                    'availability': 'https://schema.org/InStock'
                  },
                  {
                    '@type': 'Offer',
                    'name': 'Plano Profissional Mensal',
                    'description': 'Orçamentos ilimitados com IA, PDF e catálogo de serviços',
                    'price': '29.90',
                    'priceCurrency': 'BRL',
                    'url': `${siteUrl}/planos`,
                    'availability': 'https://schema.org/InStock'
                  }
                ]
              }
            },
            {
              '@type': 'FAQPage',
              '@id': `${siteUrl}/#faq`,
              'mainEntity': [
                {
                  '@type': 'Question',
                  'name': 'O que é o Orcei Fácil?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Orcei Fácil é um software de orçamento online com inteligência artificial para freelancers, autônomos e pequenas empresas. Você cria propostas comerciais profissionais em minutos, envia por link para o cliente e acompanha a aprovação em tempo real.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'Como criar um orçamento grátis com o Orcei Fácil?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Basta se cadastrar gratuitamente, descrever o serviço do seu jeito e a IA monta a proposta comercial completa. Você exporta em PDF profissional ou envia um link de aprovação diretamente para o cliente. Nenhum cartão de crédito é necessário.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'É difícil configurar o sistema ou usar a inteligência artificial?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'De forma alguma. Você não precisa saber o que é IA ou programar nada. Basta escrever os detalhes do serviço como se estivesse explicando para um colega no WhatsApp, e o sistema faz o trabalho difícil. Se preferir, você também pode cadastrar seus serviços manualmente, sem usar a IA.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'Preciso pagar alguma coisa para criar meu primeiro orçamento?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Absolutamente nada. Você cria seu primeiro orçamento de forma 100% gratuita, com acesso completo à nossa Inteligência Artificial para redigir seus serviços e gerar seu PDF profissional. Não pedimos cartão de crédito nem qualquer compromisso financeiro.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'Meus dados e os dados dos meus clientes estão seguros?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Totalmente seguros. Usamos criptografia de padrão bancário para proteger todas as suas propostas e dados de clientes. Nós nunca venderemos suas informações ou usaremos seus contatos para outros fins.'
                  }
                },
                {
                  '@type': 'Question',
                  'name': 'O Orcei Fácil funciona para qual tipo de freelancer ou negócio?',
                  'acceptedAnswer': {
                    '@type': 'Answer',
                    'text': 'Funciona para qualquer prestador de serviço: designers, desenvolvedores, fotógrafos, arquitetos, consultores, eletricistas, pintores, personal trainers, agências e muito mais. Se você cobra por um serviço, o Orcei Fácil foi feito para você.'
                  }
                }
              ]
            }
          ]
        })
      }
    ]
  })

  return {
    landing,
  }
}
