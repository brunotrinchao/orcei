import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="config-visual"]',
    popover: {
      title: 'Logo e Identidade Visual',
      description: 'Envie sua logo (recomendado 120x120px) e defina a cor principal. A logo aparece em todos os orçamentos e contratos gerados para seus clientes.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-empresa"]',
    popover: {
      title: 'Dados da Empresa',
      description: 'CNPJ, razão social e nome fantasia. Esses dados são usados para preencher automaticamente os contratos gerados.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-endereco"]',
    popover: {
      title: 'Endereço Comercial',
      description: 'Endereço usado no rodapé dos contratos e documentos gerados. Preencha o CEP para autocompletar o restante.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-contato"]',
    popover: {
      title: 'Contato e Redes Sociais',
      description: 'Telefones (com WhatsApp) e redes sociais exibidos para o cliente no orçamento enviado.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-integracoes"]',
    popover: {
      title: 'Integrações',
      description: 'Conecte sua conta Google para sincronizar calendário e arquivar orçamentos automaticamente no Drive.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-regras-negocio"]',
    popover: {
      title: 'Regras de Negócio',
      description: 'Defina a validade padrão dos orçamentos, número de parcelas e desconto à vista. Esses valores são aplicados automaticamente em novos orçamentos.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-modelo-contrato"]',
    popover: {
      title: 'Modelo de Contrato',
      description: 'Texto do contrato gerado automaticamente quando o cliente aceita um orçamento aprovado. Use variáveis como {{nome_cliente}} e {{valor_total}} — são substituídas na geração.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-modelo-termos"]',
    popover: {
      title: 'Termos e Condições',
      description: 'Texto exibido junto ao orçamento enviado ao cliente, com regras de pagamento e validade.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-privacidade"]',
    popover: {
      title: 'Privacidade e Dados',
      description: 'Exporte um backup dos seus dados, redefina configurações ou exclua sua conta.',
      side: 'top'
    }
  }
]
