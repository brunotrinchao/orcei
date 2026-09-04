import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="planos-banner"]',
    popover: {
      title: 'Créditos que nunca expiram',
      description: 'Aqui você entende o modelo: sem assinatura mensal, sem mensalidade fixa. Você compra créditos uma única vez e eles ficam na sua conta para sempre — cada ação (como enviar um orçamento ou gerar um relatório) consome o custo informado na tabela de custos desta página.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="planos-saldo"]',
    popover: {
      title: 'Seu saldo de créditos',
      description: 'Este é o seu saldo atual. Conforme você cria orçamentos ou relatórios, o valor é consumido na hora. Quando o saldo acabar, basta recarregar — os créditos novos somam com os que sobraram.',
      side: 'left'
    }
  },
  {
    element: '[data-tour="planos-cupom"]',
    popover: {
      title: 'Tem um cupom?',
      description: 'Ganhou um código de desconto ou cortesia? Cole aqui e aplique antes de escolher o pacote. O desconto é calculado na hora do pagamento.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="planos-pacotes"]',
    popover: {
      title: 'Escolha o pacote ideal',
      description: 'Os pacotes variam pelo valor por crédito — quanto maior o pacote, menor o custo de cada crédito. Ordene pela sua necessidade: comece pequeno e aumente quando a demanda crescer. Os créditos são acumulativos e vitalícios.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="planos-pacote-destaque"]',
    popover: {
      title: 'Pacote com melhor custo-benefício',
      description: 'Este pacote é marcado como recomendado porque equilibra preço e volume. Ideal para quem está começando a ter fluxo regular de clientes e quer economizar sem investir muito de uma vez.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="planos-historico"]',
    popover: {
      title: 'Histórico de recargas',
      description: 'Tudo que você comprou fica registrado aqui: data, valor, forma de pagamento e status. Use para conferir comprovantes e controlar seus gastos.',
      side: 'top'
    }
  }
]