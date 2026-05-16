<script setup lang="ts">
definePageMeta({ layout: 'blank' })
const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Termos de Uso — ${appName}` })
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
        <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase mb-4">Termos de Uso</h1>
        <p class="text-gray-500 font-medium leading-relaxed">
          Ao utilizar a plataforma Orcei, você concorda com os presentes Termos de Uso.
          Leia atentamente antes de acessar ou utilizar os serviços.
        </p>
      </div>

      <div class="space-y-12">

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">1. Aceitação dos Termos</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            O uso da plataforma Orcei implica a aceitação integral destes Termos de Uso e da nossa
            Política de Privacidade. Se você não concorda com algum dos termos, não utilize os serviços.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">2. Descrição do Serviço</h2>
          <p class="text-gray-700 font-medium leading-relaxed mb-4">
            A Orcei é uma plataforma SaaS (Software as a Service) de gestão comercial que oferece:
          </p>
          <ul class="space-y-2">
            <li v-for="feature in features" :key="feature" class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-blue-500 font-black shrink-0">→</span>
              <span>{{ feature }}</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">3. Cadastro e Conta</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            O acesso à plataforma é feito via autenticação Google OAuth. Você é responsável pela
            segurança da sua conta e por todas as atividades realizadas através dela. A Orcei não
            se responsabiliza por acessos não autorizados decorrentes de negligência do usuário.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">4. Planos e Pagamento</h2>
          <div class="space-y-4">
            <p class="text-gray-700 font-medium leading-relaxed">
              A Orcei oferece planos gratuitos (com créditos limitados) e planos pagos via assinatura mensal/anual.
              Os pagamentos são processados pela Stripe de forma segura.
            </p>
            <p class="text-gray-700 font-medium leading-relaxed">
              O cancelamento da assinatura pode ser feito a qualquer momento pelo painel de configurações.
              Não há reembolso proporcional de períodos já pagos, exceto nas hipóteses previstas pelo
              Código de Defesa do Consumidor (CDC — Lei 8.078/1990).
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">5. Uso Permitido</h2>
          <p class="text-gray-700 font-medium leading-relaxed mb-4">É vedado utilizar a Orcei para:</p>
          <ul class="space-y-2">
            <li v-for="forbidden in forbiddenUses" :key="forbidden" class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-red-400 font-black shrink-0">✗</span>
              <span>{{ forbidden }}</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">6. Propriedade Intelectual</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Todo o código, design, marca e conteúdo da plataforma Orcei são de propriedade exclusiva
            dos seus desenvolvedores. O usuário recebe uma licença de uso limitada, não exclusiva e
            intransferível. Os dados e orçamentos criados pelo usuário permanecem de sua propriedade.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">7. Limitação de Responsabilidade</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            A Orcei não se responsabiliza por: (i) perdas de receita ou dados resultantes de falhas
            técnicas imprevisíveis; (ii) conteúdo das propostas criadas pelos usuários; (iii) relações
            comerciais entre o usuário e seus clientes. O serviço é fornecido "como está", com esforço
            razoável de disponibilidade mas sem garantia de 100% de uptime.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">8. Dados do Usuário</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            O tratamento de dados pessoais é regido pela nossa
            <NuxtLink to="/privacy" class="text-blue-600 underline font-black">Política de Privacidade</NuxtLink>,
            em conformidade com a LGPD. Você pode solicitar a exclusão da sua conta e de todos os
            dados associados a qualquer momento via <strong>privacidade@orcei.com.br</strong>.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">9. Alterações nos Termos</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            A Orcei reserva o direito de atualizar estes Termos a qualquer momento. Alterações
            significativas serão comunicadas por e-mail com antecedência mínima de 30 dias. O uso
            continuado da plataforma após o prazo implica aceitação dos novos Termos.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">10. Foro e Lei Aplicável</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Estes Termos são regidos pela legislação brasileira. Para resolução de conflitos,
            fica eleito o foro da comarca de São Paulo/SP, com renúncia de qualquer outro,
            por mais privilegiado que seja.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">11. Contato</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Dúvidas sobre estes Termos: <strong>contato@orcei.com.br</strong>
          </p>
        </section>

      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-100 bg-white py-8">
      <div class="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs text-gray-400 font-medium">© 2026 Orcei · Todos os direitos reservados</p>
        <div class="flex gap-6">
          <NuxtLink to="/privacy" class="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">Privacidade</NuxtLink>
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
      features: [
        'Criação e envio de orçamentos comerciais digitais',
        'Gestão de clientes e catálogo de serviços/produtos',
        'Agenda integrada com orçamentos',
        'Geração de PDF de propostas',
        'Sugestões de precificação via Inteligência Artificial',
        'Integração com pagamentos via Stripe'
      ],
      forbiddenUses: [
        'Atividades ilegais ou que violem direitos de terceiros',
        'Envio de spam ou comunicações não solicitadas em massa',
        'Tentativas de acesso não autorizado a dados de outros usuários',
        'Engenharia reversa, descompilação ou modificação não autorizada da plataforma',
        'Uso de bots ou automações que prejudiquem a infraestrutura',
        'Emissão de orçamentos com informações fraudulentas ou enganosas'
      ]
    }
  }
}
</script>
