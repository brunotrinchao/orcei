<script setup lang="ts">
import LandingHero from '~/components/landing/LandingHero.vue'
import LandingStats from '~/components/landing/LandingStats.vue'
import AIBeforeAfter from '~/components/landing/AIBeforeAfter.vue'
import LandingFeatures from '~/components/landing/LandingFeatures.vue'
import LandingHowItWorks from '~/components/landing/LandingHowItWorks.vue'
import LandingFAQ from '~/components/landing/LandingFAQ.vue'
import LandingCTA from '~/components/landing/LandingCTA.vue'

definePageMeta({
  layout: 'landing'
})

const { loggedIn } = useUserSession()

watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})

const { data: systemInfo } = useFetch<any>('/api/system/status')

const landing = computed(() => systemInfo.value?.landingPage || {
  heroTitle: 'Gere seu primeiro orçamento profissional grátis em 2 minutos.',
  heroSubtitle: 'Escreva do seu jeito: nossa IA organiza as especificações e monta uma proposta de orçamento impecável e contrato integrado prontos para aprovação do seu cliente. Grátis para começar!',
  features: []
})

// Puxar configurações de domínio público para compor URLs absolutas
const config = useRuntimeConfig()
const siteUrl = config.public.siteUrl || 'https://orceifacil.com.br'
const ogImageUrl = `${siteUrl}/images/landpage-banner.png`

// Otimização Crítica do LCP (Preload da Imagem principal do Banner no Head)
useHead({
  link: [
    {
      rel: 'preload',
      as: 'image',
      href: '/images/landpage-banner.png',
      fetchpriority: 'high'
    }
  ]
})

// SEO Avançado Dinâmico (OpenGraph & Twitter Cards com URLs Absolutas)
useSeoMeta({
  title: 'Orcei Fácil — Crie seu Primeiro Orçamento Grátis com IA em Segundos',
  ogTitle: 'Orcei Fácil — Crie seu Primeiro Orçamento Grátis com IA em Segundos',
  description: 'Escreva do seu jeito: nossa IA organiza as especificações e monta uma proposta de orçamento impecável e PDF profissional prontos para aprovação online. Primeiro orçamento 100% grátis!',
  ogDescription: 'Escreva do seu jeito: nossa IA organiza as especificações e monta uma proposta de orçamento impecável e PDF profissional prontos para aprovação online. Primeiro orçamento 100% grátis!',
  ogImage: ogImageUrl, // Correção Crítica: URL Absoluta
  ogUrl: siteUrl,
  twitterCard: 'summary_large_image',
  twitterTitle: 'Orcei Fácil — Crie seu Primeiro Orçamento Grátis com IA em Segundos',
  twitterDescription: 'Escreva do seu jeito: nossa IA organiza as especificações e monta uma proposta de orçamento impecável e PDF profissional prontos para aprovação. Primeiro orçamento grátis!',
  twitterImage: ogImageUrl, // Correção Crítica: URL Absoluta
})

// Injeção de Dados Estruturados JSON-LD Schema Unificado (@graph) para Rich Snippets Avançados de FAQ e Ofertas de Produto/SaaS
useHead({
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebApplication',
            '@id': `${siteUrl}/#webapp`,
            'name': 'Orcei Fácil',
            'url': siteUrl,
            'description': 'Plataforma inteligente de criação, envio e aprovação online de orçamentos para freelancers e pequenas empresas. Crie seu primeiro orçamento grátis hoje.',
            'applicationCategory': 'BusinessApplication',
            'operatingSystem': 'All',
            'featureList': [
              'Criação de orçamentos assistida por Inteligência Artificial',
              'Acompanhamento e notificações de leitura em tempo real',
              'Assinatura e aprovação digital online pelo cliente',
              'Exportação em PDF profissional e catálogo de serviços'
            ]
          },
          {
            '@type': 'Product',
            '@id': `${siteUrl}/#product`,
            'name': 'Orcei Fácil',
            'image': ogImageUrl,
            'description': 'Plataforma inteligente de criação, envio e aprovação online de orçamentos para freelancers e pequenas empresas.',
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
                  'price': '0.00',
                  'priceCurrency': 'BRL',
                  'url': siteUrl
                },
                {
                  '@type': 'Offer',
                  'name': 'Plano Avulso (Créditos)',
                  'price': '15.00',
                  'priceCurrency': 'BRL',
                  'url': siteUrl
                },
                {
                  '@type': 'Offer',
                  'name': 'Plano Profissional Mensal',
                  'price': '29.90',
                  'priceCurrency': 'BRL',
                  'url': siteUrl
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
                'name': 'É difícil configurar o sistema ou usar a inteligência artificial?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'De forma alguma. Nós removemos toda a complexidade técnica. Você não precisa saber o que é IA ou programar nada. Basta escrever os detalhes do serviço como se estivesse explicando para um colega no WhatsApp, e o sistema faz o trabalho difícil. Se preferir, você também pode cadastrar seus serviços manualmente, sem usar a IA.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Preciso pagar alguma coisa para criar meu primeiro orçamento?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Absolutamente nada. Você pode experimentar a plataforma e criar seu primeiro orçamento de forma 100% gratuita, com acesso completo à nossa Inteligência Artificial para redigir seus serviços e gerar seu PDF profissional. Não pedimos cartão de crédito nem qualquer compromisso financeiro. Basta se cadastrar e criar.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Meus dados e os dados dos meus clientes estão seguros?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Totalmente seguros. Usamos criptografia de padrão bancário para proteger todas as suas propostas e dados de clientes. Nós nunca venderemos suas informações ou usaremos seus contatos para outros fins. O que é seu, continua exclusivamente seu.'
                }
              },
              {
                '@type': 'Question',
                'name': 'O orçamento gerado pela IA não vai parecer frio ou artificial para os meus clientes?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Pelo contrário. Nós calibramos nossa inteligência artificial para que ela soe humana, clara e objetiva. Ela organiza a estrutura técnica do seu serviço para dar clareza, mas mantém o tom de voz profissional e direto. O seu cliente recebe uma proposta limpa e fácil de entender, e não um texto robótico cheio de termos corporativos difíceis.'
                }
              }
            ]
          }
        ]
      })
    }
  ]
})
</script>

<template>
  <main class="min-h-screen bg-slate-950 text-white selection:bg-blue-500/80 selection:text-white overflow-x-hidden">
    <!-- 1. Hero Section Premium (Luxury Minimal & IA) -->
    <LandingHero
      :title="landing.heroTitle"
      :subtitle="landing.heroSubtitle"
      :app-name="landing.appName"
    />

    <!-- 2. Barra de Estatísticas & Prova Social -->
    <LandingStats />

    <!-- 3. Componente Mágico Interativo de Antes e Depois -->
    <AIBeforeAfter />

    <!-- 4. Grade de Benefícios & Features (Tree-Shaking) -->
    <LandingFeatures :features="landing.features" />

    <!-- 5. Fluxo de 3 Etapas (Como Funciona) -->
    <LandingHowItWorks />

    <!-- 6. FAQ com Respostas de objeções WAI-ARIA -->
    <LandingFAQ />

    <!-- 7. CTA Final de alta conversão -->
    <LandingCTA :app-name="landing.appName" />
  </main>
</template>
