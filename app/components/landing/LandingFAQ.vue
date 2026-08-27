<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown, HelpCircle } from 'lucide-vue-next'

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
  <section id="faq" class="mb-24 py-16 scroll-mt-20 relative bg-white" aria-labelledby="faq-title">
    <div class="max-w-4xl mx-auto px-4">
      <div class="text-center mb-16">
        <p class="text-xs font-black text-[#0870f8] uppercase tracking-widest mb-3">Dúvidas Frequentes</p>
        <h2 id="faq-title" class="text-3xl md:text-5xl font-black text-[#0c1424] tracking-tight">Perguntas Frequentes</h2>
        <p class="text-[#61708a] max-w-xl mx-auto mt-4 font-medium text-sm md:text-base">
          Tem alguma dúvida sobre o Orcei Fácil? Encontre respostas rápidas para as principais dúvidas.
        </p>
      </div>

      <!-- Accordion Acessível (WAI-ARIA) -->
      <div class="space-y-4" role="presentation">
        <div 
          v-for="(item, index) in faqItems" 
          :key="index"
          class="bg-[#f4f7fb] border border-[#dfe6f0] rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
        >
          <!-- Gatilho do Accordion -->
          <button 
            type="button"
            class="flex w-full items-center justify-between p-6 text-left font-bold text-base md:text-lg text-[#0c1424] hover:bg-[#e9f3ff]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0870f8] transition-all group"
            :aria-expanded="item.isOpen ? 'true' : 'false'"
            :aria-controls="`faq-content-${index}`"
            :id="`faq-trigger-${index}`"
            @click="toggleItem(index)"
          >
            <span class="flex items-center gap-3 pr-4">
              <HelpCircle class="w-5 h-5 text-[#0870f8] flex-shrink-0" />
              {{ item.question }}
            </span>
            <ChevronDown 
              class="h-5 w-5 text-[#61708a] transition-transform duration-300 flex-shrink-0"
              :class="{ 'rotate-180 text-[#0870f8]': item.isOpen }" 
              aria-hidden="true" 
            />
          </button>

          <!-- Conteúdo do Accordion -->
          <div 
            :id="`faq-content-${index}`"
            role="region"
            :aria-labelledby="`faq-trigger-${index}`"
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="item.isOpen ? 'max-h-[300px] border-t border-[#dfe6f0]' : 'max-h-0'"
          >
            <div class="p-6 text-sm md:text-base text-[#61708a] leading-relaxed font-medium bg-white">
              {{ item.answer }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
