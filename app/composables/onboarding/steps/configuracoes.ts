import type { TourStep } from '../types'

export const steps: TourStep[] = [
  {
    element: '[data-tour="config-visual"]',
    popover: {
      title: 'Logo e Identidade Visual',
      description: 'Envie sua logo (recomendado 120x120px) e defina a cor principal. A logo aparece em todos os orcamentos e contratos gerados para seus clientes.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-empresa"]',
    popover: {
      title: 'Dados da Empresa',
      description: 'CNPJ, razao social e nome fantasia. Esses dados sao usados para preencher automaticamente os contratos gerados.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-endereco"]',
    popover: {
      title: 'Endereco Comercial',
      description: 'Endereco usado no rodape dos contratos e documentos gerados. Preencha o CEP para autocompletar o restante.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-contato"]',
    popover: {
      title: 'Contato e Redes Sociais',
      description: 'Telefones (com WhatsApp) e redes sociais exibidos para o cliente no orcamento enviado.',
      side: 'bottom'
    }
  },
  {
    element: '[data-tour="config-integracoes"]',
    popover: {
      title: 'Integracoes',
      description: 'Conecte sua conta Google para sincronizar calendario e arquivar orcamentos automaticamente no Drive.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-regras-negocio"]',
    popover: {
      title: 'Regras de Negocio',
      description: 'Defina a validade padrao dos orcamentos, numero de parcelas e desconto a vista. Esses valores sao aplicados automaticamente em novos orcamentos.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-modelo-contrato"]',
    popover: {
      title: 'Modelo de Contrato',
      description: 'Texto do contrato gerado automaticamente quando o cliente aceita um orcamento aprovado. Use variaveis como {{nome_cliente}} e {{valor_total}} — sao substituidas na geracao.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-modelo-termos"]',
    popover: {
      title: 'Termos e Condicoes',
      description: 'Texto exibido junto ao orcamento enviado ao cliente, com regras de pagamento e validade.',
      side: 'top'
    }
  },
  {
    element: '[data-tour="config-privacidade"]',
    popover: {
      title: 'Privacidade e Dados',
      description: 'Exporte um backup dos seus dados, redefina configuracoes ou exclua sua conta.',
      side: 'top'
    }
  }
]
