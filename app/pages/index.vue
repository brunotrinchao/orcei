<script setup lang="ts">
import LandingHero from '~/components/landing/LandingHero.vue'
import LandingStats from '~/components/landing/LandingStats.vue'
import LandingPainPoints from '~/components/landing/LandingPainPoints.vue'
import AIBeforeAfter from '~/components/landing/AIBeforeAfter.vue'
import LandingFeatures from '~/components/landing/LandingFeatures.vue'
import LandingHowItWorks from '~/components/landing/LandingHowItWorks.vue'
import LandingTestimonials from '~/components/landing/LandingTestimonials.vue'
import LandingFAQ from '~/components/landing/LandingFAQ.vue'
import LandingCTA from '~/components/landing/LandingCTA.vue'
import { useLandingPage } from '~/composables/pages/useLandingPage'

definePageMeta({
  layout: 'landing'
})

const { landing } = useLandingPage()
</script>

<template>
  <main class="landing-page-root selection:bg-[#e9f3ff] selection:text-[#0870f8]">
    <!-- 1. Hero Section Premium (Luxury Minimal & IA) -->
    <LandingHero
      :title="landing.heroTitle"
      :subtitle="landing.heroSubtitle"
      :app-name="landing.appName"
      video-url="/videos/orceifacil-create-proposal-ia.mp4"
    />

    <!-- 2. Barra de Estatísticas & Prova Social -->
    <LandingStats />

    <!-- 3. Dor do freelancer antes da solução -->
    <LandingPainPoints />

    <!-- 4. Componente Mágico Interativo de Antes e Depois -->
    <AIBeforeAfter />

    <!-- 5. Grade de Benefícios & Features (Tree-Shaking) -->
    <LandingFeatures :features="landing.features" />

    <!-- 6. Fluxo de 3 Etapas (Como Funciona) -->
    <LandingHowItWorks />

    <!-- 7. Planos e Preços -->
    <LandingPricing />

    <!-- 8. Depoimentos / Prova Social Qualitativa -->
    <!-- <LandingTestimonials /> -->

    <!-- 9. FAQ com Respostas de objeções WAI-ARIA -->
    <LandingFAQ />

    <!-- 10. CTA Final de alta conversão -->
    <LandingCTA :app-name="landing.appName" />
  </main>
</template>
