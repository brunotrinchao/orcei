<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Minus } from 'lucide-vue-next'

interface FAQItem {
  question: string
  answer: string
  isOpen: boolean
}

const faqItems = ref<FAQItem[]>([
  {
    question: 'O que é o Orcei Fácil?',
    answer: 'Orcei Fácil é um software de orçamento online com inteligência artificial para freelancers, autônomos e pequenas empresas. Você cria propostas comerciais profissionais em minutos, envia por link para o cliente e acompanha a aprovação em tempo real — sem precisar de Word, Excel ou ferramentas complicadas.',
    isOpen: true
  },
  {
    question: 'Como criar um orçamento grátis com o Orcei Fácil?',
    answer: 'Basta se cadastrar gratuitamente, descrever o serviço do seu jeito e a IA monta a proposta comercial completa. Você exporta em PDF profissional ou envia um link de aprovação diretamente para o cliente. Nenhum cartão de crédito é necessário para começar.',
    isOpen: false
  },
  {
    question: 'É difícil configurar o sistema ou usar a inteligência artificial?',
    answer: 'De forma alguma. Você não precisa saber o que é IA ou programar nada. Basta escrever os detalhes do serviço como se estivesse explicando para um colega no WhatsApp, e o sistema faz o trabalho difícil. Se preferir, você também pode cadastrar seus serviços manualmente, sem usar a IA.',
    isOpen: false
  },
  {
    question: 'Preciso pagar alguma coisa para criar meu primeiro orçamento?',
    answer: 'Absolutamente nada. Você cria seu primeiro orçamento de forma 100% gratuita, com acesso completo à nossa Inteligência Artificial para redigir seus serviços e gerar seu PDF profissional. Não pedimos cartão de crédito nem qualquer compromisso financeiro. Basta se cadastrar e criar.',
    isOpen: false
  },
  {
    question: 'Meus dados e os dados dos meus clientes estão seguros?',
    answer: 'Totalmente seguros. Usamos criptografia de padrão bancário para proteger todas as suas propostas e dados de clientes. Nós nunca venderemos suas informações ou usaremos seus contatos para outros fins. O que é seu, continua exclusivamente seu.',
    isOpen: false
  },
  {
    question: 'O Orcei Fácil funciona para qual tipo de freelancer ou negócio?',
    answer: 'Funciona para qualquer prestador de serviço: designers, desenvolvedores, fotógrafos, arquitetos, consultores, eletricistas, pintores, personal trainers, agências e muito mais. Se você cobra por um serviço, o Orcei Fácil foi feito para você.',
    isOpen: false
  },
  {
    question: 'O orçamento gerado pela IA não vai parecer frio ou artificial para os meus clientes?',
    answer: 'Pelo contrário. Nós calibramos nossa inteligência artificial para que ela soe humana, clara e objetiva. Ela organiza a estrutura técnica do seu serviço para dar clareza, mas mantém o tom de voz profissional e direto. O seu cliente recebe uma proposta limpa e fácil de entender, e não um texto robótico cheio de termos corporativos difíceis.',
    isOpen: false
  }
])

function toggleItem(index: number) {
  faqItems.value[index].isOpen = !faqItems.value[index].isOpen
}
</script>

<template>
  <section id="faq" class="mb-24 py-20 scroll-mt-20 relative bg-white" aria-labelledby="faq-title">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        <!-- Coluna da Esquerda (Cabeçalho Fixo / Destacado) -->
        <div class="lg:col-span-5 lg:sticky lg:top-28 space-y-4">
          <p class="text-xs font-black text-[#0870f8] uppercase tracking-widest">
            DÚVIDAS FREQUENTES
          </p>

          <h2 id="faq-title" class="text-4xl sm:text-5xl font-black text-[#0c1424] tracking-tight leading-[1.1]">
            Antes de<br class="hidden sm:block" /> começar.
          </h2>

          <p class="text-[#61708a] font-medium leading-relaxed text-sm sm:text-base max-w-md pt-2">
            O Orcei Fácil é uma plataforma completa de propostas e orçamentos com Inteligência Artificial. Ela acelera a criação comercial, mantém sua marca e facilita a aprovação do seu cliente.
          </p>
        </div>

        <!-- Coluna da Direita (Lista Minimalista Accordion com Números) -->
        <div class="lg:col-span-7 divide-y divide-[#dfe6f0] border-y border-[#dfe6f0]">
          <div
            v-for="(item, index) in faqItems"
            :key="index"
            class="py-6 transition-colors group"
          >
            <!-- Botão Gatilho do Accordion -->
            <button
              type="button"
              class="w-full flex items-center justify-between gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0870f8] rounded-lg cursor-pointer"
              :aria-expanded="item.isOpen ? 'true' : 'false'"
              :aria-controls="`faq-content-${index}`"
              :id="`faq-trigger-${index}`"
              @click="toggleItem(index)"
            >
              <div class="flex items-center gap-4 sm:gap-6 pr-4">
                <!-- Número no formato 01, 02, ... -->
                <span class="text-xs sm:text-sm font-bold font-mono text-[#61708a]/60 flex-shrink-0 w-6 sm:w-8">
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                
                <!-- Pergunta -->
                <h3 class="font-bold text-base sm:text-lg text-[#0c1424] group-hover:text-[#0870f8] transition-colors leading-snug">
                  {{ item.question }}
                </h3>
              </div>

              <!-- Ícone de Mais (+) ou Menos (-) -->
              <div class="flex-shrink-0 text-[#0870f8] transition-transform duration-200">
                <Minus v-if="item.isOpen" class="w-5 h-5 stroke-[2.5]" />
                <Plus v-else class="w-5 h-5 stroke-[2.5] text-[#0870f8]" />
              </div>
            </button>

            <!-- Conteúdo da Resposta com transição suave -->
            <div
              :id="`faq-content-${index}`"
              role="region"
              :aria-labelledby="`faq-trigger-${index}`"
              class="transition-all duration-300 ease-in-out overflow-hidden"
              :class="item.isOpen ? 'max-h-[400px] pt-4 opacity-100' : 'max-h-0 opacity-0'"
            >
              <p class="pl-10 sm:pl-14 pr-4 text-sm sm:text-base text-[#61708a] font-medium leading-relaxed">
                {{ item.answer }}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>
</template>
