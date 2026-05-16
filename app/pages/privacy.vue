<script setup lang="ts">
definePageMeta({ layout: 'blank' })
const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Política de Privacidade — ${appName}` })
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div class="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/"><AppLogo size="sm" /></NuxtLink>
        <NuxtLink to="/" class="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">← Voltar</NuxtLink>
      </div>
    </header>

    <!-- Conteúdo -->
    <main class="max-w-3xl mx-auto px-6 py-16">
      <div class="mb-12">
        <p class="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Última atualização: Janeiro de 2026</p>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase mb-4">Política de Privacidade</h1>
        <p class="text-gray-500 font-medium leading-relaxed">
          A Orcei está comprometida com a proteção dos seus dados pessoais, em conformidade com a
          Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018) e demais legislações aplicáveis.
        </p>
      </div>

      <div class="space-y-12 prose-legal">

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">1. Quem Somos</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            A <strong>Orcei</strong> é uma plataforma de gestão comercial para freelancers e pequenas empresas,
            que permite criação e envio de orçamentos, gestão de clientes, catálogo de serviços e controle de agenda.
            O responsável pelo tratamento dos dados (controlador) é a empresa operadora da plataforma Orcei.
          </p>
          <p class="text-gray-700 font-medium leading-relaxed mt-3">
            Para dúvidas sobre privacidade, entre em contato via: <strong>privacidade@orcei.com.br</strong>
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">2. Dados Coletados e Finalidade</h2>
          <div class="space-y-4">
            <div class="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 class="text-sm font-black text-gray-900 mb-2">Dados de Cadastro</h3>
              <p class="text-sm text-gray-500 font-medium leading-relaxed">Nome, e-mail e foto de perfil obtidos via autenticação Google OAuth. Utilizados para identificação e acesso à plataforma.</p>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 class="text-sm font-black text-gray-900 mb-2">Dados da Empresa</h3>
              <p class="text-sm text-gray-500 font-medium leading-relaxed">Razão social, CNPJ, logotipo, endereço e telefone. Utilizados para personalização das propostas comerciais e documentos enviados aos clientes.</p>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 class="text-sm font-black text-gray-900 mb-2">Dados de Clientes</h3>
              <p class="text-sm text-gray-500 font-medium leading-relaxed">Nome, e-mail, telefone, CPF/CNPJ e endereço dos clientes cadastrados pelo usuário. Tratados exclusivamente para emissão de orçamentos e comunicações relacionadas.</p>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 class="text-sm font-black text-gray-900 mb-2">Dados de Pagamento</h3>
              <p class="text-sm text-gray-500 font-medium leading-relaxed">Informações de assinatura e cobrança são processadas pela Stripe Inc. A Orcei não armazena dados de cartão de crédito.</p>
            </div>
            <div class="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 class="text-sm font-black text-gray-900 mb-2">Dados de Uso e Analytics</h3>
              <p class="text-sm text-gray-500 font-medium leading-relaxed">Com seu consentimento, coletamos dados de navegação (páginas visitadas, tempo de sessão, cliques) via Google Analytics, Google Tag Manager e Hotjar, para melhoria da plataforma.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">3. Base Legal (Art. 7º, LGPD)</h2>
          <ul class="space-y-3">
            <li class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-blue-500 font-black shrink-0">→</span>
              <span><strong>Execução de contrato</strong>: tratamento necessário para prestação dos serviços contratados (art. 7º, V)</span>
            </li>
            <li class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-blue-500 font-black shrink-0">→</span>
              <span><strong>Consentimento</strong>: cookies de analytics e marketing (art. 7º, I) — pode ser revogado a qualquer momento</span>
            </li>
            <li class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-blue-500 font-black shrink-0">→</span>
              <span><strong>Legítimo interesse</strong>: segurança da plataforma e prevenção a fraudes (art. 7º, IX)</span>
            </li>
            <li class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-blue-500 font-black shrink-0">→</span>
              <span><strong>Obrigação legal</strong>: dados fiscais quando exigido por lei (art. 7º, II)</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">4. Compartilhamento com Terceiros</h2>
          <div class="space-y-3">
            <div v-for="partner in partners" :key="partner.name" class="flex gap-4 bg-white rounded-xl border border-gray-100 p-4">
              <div class="flex-1">
                <p class="text-sm font-black text-gray-900">{{ partner.name }}</p>
                <p class="text-xs text-gray-500 font-medium mt-0.5">{{ partner.purpose }}</p>
              </div>
              <a :href="partner.policy" target="_blank" class="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest self-center shrink-0">Política →</a>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">5. Seus Direitos (Art. 18, LGPD)</h2>
          <ul class="space-y-2">
            <li v-for="right in rights" :key="right" class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-green-500 font-black shrink-0">✓</span>
              <span>{{ right }}</span>
            </li>
          </ul>
          <p class="text-sm text-gray-500 font-medium mt-6">
            Para exercer seus direitos, envie solicitação para <strong>privacidade@orcei.com.br</strong>.
            Responderemos em até 15 dias úteis.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">6. Cookies e Rastreamento</h2>
          <p class="text-gray-700 font-medium leading-relaxed mb-4">
            Utilizamos cookies essenciais (necessários para funcionamento da plataforma) e cookies de analytics
            (apenas com seu consentimento). Você pode gerenciar suas preferências a qualquer momento clicando em
            "Gerenciar Cookies" no rodapé.
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-xs border-collapse">
              <thead>
                <tr class="bg-gray-50">
                  <th class="text-left p-3 font-black text-gray-500 uppercase tracking-widest border border-gray-100">Cookie</th>
                  <th class="text-left p-3 font-black text-gray-500 uppercase tracking-widest border border-gray-100">Finalidade</th>
                  <th class="text-left p-3 font-black text-gray-500 uppercase tracking-widest border border-gray-100">Duração</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cookie in cookies" :key="cookie.name" class="border-b border-gray-50">
                  <td class="p-3 font-black text-gray-900 border border-gray-100">{{ cookie.name }}</td>
                  <td class="p-3 text-gray-500 border border-gray-100">{{ cookie.purpose }}</td>
                  <td class="p-3 text-gray-500 border border-gray-100">{{ cookie.duration }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">7. Retenção e Exclusão</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Seus dados são mantidos enquanto sua conta estiver ativa. Ao solicitar exclusão da conta,
            os dados são removidos em até 30 dias, exceto os legalmente obrigatórios (fiscal/contábil),
            que são mantidos pelo prazo legal aplicável.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">8. Segurança</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (TLS),
            controle de acesso baseado em autenticação OAuth 2.0, ambientes isolados por perfil e backups regulares.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">9. Encarregado de Dados (DPO)</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Encarregado de Proteção de Dados: <strong>privacidade@orcei.com.br</strong><br>
            Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" class="text-blue-600 underline">www.gov.br/anpd</a>
          </p>
        </section>

      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-100 bg-white py-8">
      <div class="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs text-gray-400 font-medium">© 2026 Orcei · Todos os direitos reservados</p>
        <div class="flex gap-6">
          <NuxtLink to="/terms" class="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">Termos de Uso</NuxtLink>
          <NuxtLink to="/" class="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">Voltar ao Início</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>

<script lang="ts">
export default {
  data() {
    return {
      partners: [
        { name: 'Stripe Inc.', purpose: 'Processamento de pagamentos e assinaturas', policy: 'https://stripe.com/br/privacy' },
        { name: 'Google LLC', purpose: 'Autenticação OAuth, Analytics (GA4) e Tag Manager', policy: 'https://policies.google.com/privacy' },
        { name: 'Cloudinary Inc.', purpose: 'Armazenamento e entrega de imagens', policy: 'https://cloudinary.com/privacy' },
        { name: 'Resend Inc.', purpose: 'Envio de e-mails transacionais', policy: 'https://resend.com/legal/privacy-policy' },
        { name: 'Hotjar Ltd.', purpose: 'Análise de comportamento e mapas de calor (com consentimento)', policy: 'https://www.hotjar.com/legal/policies/privacy/' },
        { name: 'MongoDB Atlas', purpose: 'Armazenamento de dados em nuvem', policy: 'https://www.mongodb.com/legal/privacy-policy' }
      ],
      rights: [
        'Confirmação da existência de tratamento dos seus dados',
        'Acesso aos dados pessoais tratados',
        'Correção de dados incompletos, inexatos ou desatualizados',
        'Anonimização, bloqueio ou eliminação de dados desnecessários',
        'Portabilidade dos seus dados',
        'Eliminação dos dados tratados com base no consentimento',
        'Informação sobre compartilhamento com terceiros',
        'Revogação do consentimento a qualquer momento'
      ],
      cookies: [
        { name: 'orcei:session-id', purpose: 'Identificador de sessão anônima para consentimento', duration: '1 ano' },
        { name: 'orcei:consent', purpose: 'Registro da decisão de cookies', duration: '1 ano' },
        { name: 'nuxt-session', purpose: 'Sessão autenticada (essencial)', duration: 'Sessão' },
        { name: '_ga, _gid', purpose: 'Google Analytics — analytics de uso (com consentimento)', duration: '2 anos / 24h' },
        { name: '_hjSession', purpose: 'Hotjar — análise de comportamento (com consentimento)', duration: '30 min' }
      ]
    }
  }
}
</script>
