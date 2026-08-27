<script setup lang="ts">
definePageMeta({ layout: 'blank' })
const { public: { appName } } = useRuntimeConfig()
useHead({ title: `Termos de Uso — ${appName}` })

const { public: { emailContactDefault } } = useRuntimeConfig()
const { data: systemInfo } = useFetch<any>('/api/system/status', { key: 'system-status' })
const dynamicAppName = computed(() => systemInfo.value?.landingPage?.appName || appName)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-100 sticky top-0 z-10">
      <div class="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <NuxtLink to="/"><AppLogo size="sm" /></NuxtLink>
        <NuxtLink to="/" class="text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">← Voltar ao Início</NuxtLink>
      </div>
    </header>

    <!-- Conteúdo -->
    <main class="max-w-3xl mx-auto px-6 py-16">
      <div class="mb-12">
        <p class="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Última atualização: Agosto de 2026</p>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight uppercase mb-4">Termos de Uso</h1>
        <p class="text-gray-500 font-medium leading-relaxed">
          Ao utilizar a plataforma {{ dynamicAppName }}, você concorda com os presentes Termos de Uso.
          Leia atentamente antes de acessar ou utilizar nossos serviços.
        </p>
      </div>

      <div class="space-y-12">

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">1. Aceitação dos Termos</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            O uso da plataforma {{ dynamicAppName }} implica a aceitação integral destes Termos de Uso e da nossa
            <NuxtLink to="/privacy" class="text-blue-600 underline font-bold">Política de Privacidade</NuxtLink>. Se você não concorda com qualquer disposição destes termos, orientamos que interrompa o uso dos serviços imediatamente.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">2. Descrição do Serviço</h2>
          <p class="text-gray-700 font-medium leading-relaxed mb-4">
            A {{ dynamicAppName }} é uma plataforma SaaS (Software as a Service) de gestão e aceleração comercial destinada a profissionais autônomos, freelancers e pequenas empresas, oferecendo:
          </p>
          <ul class="space-y-2">
            <li v-for="feature in features" :key="feature" class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-blue-500 font-black shrink-0">→</span>
              <span>{{ feature }}</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">3. Cadastro e Segurança da Conta</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            O acesso à plataforma é realizado com segurança via autenticação Google OAuth ou credenciais autorizadas. O usuário é o único responsável pela guarda e confidencialidade da sua conta, bem como por todas as atividades realizadas nela. A {{ dynamicAppName }} não se responsabiliza por acessos indevidos decorrentes de negligência ou compartilhamento não autorizado de credenciais por parte do usuário.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">4. Pacotes de Créditos e Pagamentos</h2>
          <div class="space-y-4">
            <p class="text-gray-700 font-medium leading-relaxed">
              A {{ dynamicAppName }} opera no modelo de <strong>Créditos</strong> e pacotes comerciais sem necessidade de mensalidade obrigatória, além de disponibilizar degustação gratuita para novos cadastros.
            </p>
            <p class="text-gray-700 font-medium leading-relaxed">
              <strong>Regras dos Créditos:</strong> Os créditos adquiridos em pacotes não possuem data de expiração e são consumidos à medida que o usuário gera novos orçamentos ou relatórios alimentados por Inteligência Artificial.
            </p>
            <p class="text-gray-700 font-medium leading-relaxed">
              Os pagamentos são processados de forma segura e criptografada por intermediadores de pagamento homologados (como Stripe). O direito de arrependimento e reembolso de pacotes de créditos não utilizados poderá ser exercido em até 7 (sete) dias corridos após a compra, em conformidade com o Artigo 49 do Código de Defesa do Consumidor (CDC — Lei 8.078/1990). Créditos já consumidos na geração de serviços não são passíveis de reembolso.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">5. Uso Permitido e Diretrizes de Inteligência Artificial</h2>
          <p class="text-gray-700 font-medium leading-relaxed mb-4">É expressamente vedado utilizar a {{ dynamicAppName }} para:</p>
          <ul class="space-y-2">
            <li v-for="forbidden in forbiddenUses" :key="forbidden" class="flex gap-3 text-sm text-gray-700 font-medium">
              <span class="text-red-400 font-black shrink-0">✗</span>
              <span>{{ forbidden }}</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">6. Propriedade Intelectual e Dados do Usuário</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Todo o código fonte, algoritmos, design, marcas e tecnologias da plataforma {{ dynamicAppName }} são de propriedade intelectual exclusiva dos seus criadores. O usuário recebe uma licença de uso limitada, revogável e não exclusiva. Todos os dados, marcas de clientes, catálogos de preços e orçamentos cadastrados ou criados pelo usuário permanecem sob propriedade exclusiva do usuário.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">7. Isenção de Responsabilidade sobre Sugestões da IA e Relações Comerciais</h2>
          <div class="space-y-4">
            <p class="text-gray-700 font-medium leading-relaxed">
              <strong>Assistência da IA:</strong> As sugestões de redação técnica, preços, cálculos de insumos e especificações geradas pela Inteligência Artificial possuem caráter puramente assistutivo e informativo. Cabe única e exclusivamente ao Usuário revisar, validar e aprovar os valores e condições antes de emitir a proposta ao seu cliente final.
            </p>
            <p class="text-gray-700 font-medium leading-relaxed">
              <strong>Intermediação Tecnológica:</strong> A {{ dynamicAppName }} atua como fornecedora de software e não participa, direta ou indiretamente, das negociações, contratos de prestação de serviços ou disputas financeiras travadas entre o Usuário e seus respectivos clientes finais.
            </p>
          </div>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">8. Privacidade e Proteção de Dados (LGPD)</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            O tratamento de dados pessoais pela plataforma é estritamente regido pela nossa
            <NuxtLink to="/privacy" class="text-blue-600 underline font-black">Política de Privacidade</NuxtLink>,
            em total conformidade com a LGPD (Lei nº 13.709/2018). O usuário poderá solicitar a exportação ou exclusão definitiva da sua conta e dados a qualquer momento via e-mail em <strong>{{ emailContactDefault }}</strong>.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">9. Alterações nos Termos</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            A {{ dynamicAppName }} reserva-se o direito de atualizar estes Termos periodicamente para refletir melhorias no sistema ou exigências legais. Alterações relevantes serão informadas pelos canais oficiais ou por e-mail.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">10. Foro e Lei Aplicável</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Estes Termos são regidos e interpretados segundo as leis da República Federativa do Brasil. Fica eleito o foro da comarca de São Paulo/SP para sanar eventuais controvérsias decorrentes deste instrumento.
          </p>
        </section>

        <section>
          <h2 class="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">11. Contato e Suporte</h2>
          <p class="text-gray-700 font-medium leading-relaxed">
            Para dúvidas ou solicitações em relação a estes Termos, entre em contato via e-mail: <strong>{{ emailContactDefault }}</strong>
          </p>
        </section>

      </div>
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-100 bg-white py-8">
      <div class="max-w-3xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs text-gray-400 font-medium">© 2026 {{ dynamicAppName }} · Todos os direitos reservados</p>
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
        'Criação, edição e estruturação de orçamentos digitais alimentados por Inteligência Artificial',
        'Conversão e leitura de áudios/mensagens do WhatsApp em escopos técnicos detalhados',
        'Geração de links de propostas web interativas com confirmação de leitura em tempo real e aceite digital',
        'Gestão completa de clientes, catálogo de serviços e modelos de orçamentos recorrentes',
        'Exportação e arquivamento de propostas em formato PDF de alta resolução',
        'Integração opcional de compromissos com Google Agenda e backup com Google Drive',
        'Busca e preenchimento automático de endereços via consulta pública de CEP (ViaCEP)',
        'Processamento seguro de compras de créditos e pacotes comerciais via Stripe'
      ],
      forbiddenUses: [
        'Prática de atividades ilícitas ou violação de direitos autorais/propriedade de terceiros',
        'Injeção maliciosa de instruções (*prompt injection*) ou envio de conteúdos ofensivos aos modelos de IA',
        'Envio indevido de spam ou comunicações em massa não solicitadas',
        'Engenharia reversa, descompilação ou ataques cibernéticos contra a infraestrutura do sistema',
        'Geração ou emissão deliberada de orçamentos com informações fraudulentas ou dados falsificados'
      ]
    }
  }
}
</script>
