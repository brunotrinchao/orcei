import { computed } from 'vue'
import { SendMethod } from '../../../../types/enums'
import { User, Calendar, CreditCard, Mail, Link as LinkIcon, AlertCircle, Sparkles, CheckCircle2, ShieldAlert, Circle, Clock } from 'lucide-vue-next'

export function useProposalStepSummary(props: { form: any; finalTotal: number; clients: any[]; initialExpiresAt?: string | null; validityDays?: number }) {
  const selectedClient = computed(() => {
    return props.form.client?.name ? props.form.client : null
  })

  const getSendMethodLabel = (method: SendMethod) => {
    if (method === SendMethod.AUTO) return 'E-mail Automático'
    if (method === SendMethod.MANUAL) return 'Link Manual (WhatsApp/Outros)'
    return 'Não definido'
  }

  const scopeHasDescriptions = computed(() => {
    const items = props.form.items || []
    return items.length > 0 && items.every((i: any) => i.description?.trim())
  })

  const priceInstallmentMismatch = computed(() =>
    props.finalTotal > 5000 && (props.form.paymentConfig?.installments || 1) < 4
  )
  const priceInstallmentGood = computed(() =>
    props.finalTotal > 2000 && (props.form.paymentConfig?.installments || 1) >= 4
  )

  const scoreCriteria = computed(() => {
    const upsellCount = props.form.upsellItems?.length || 0
    const cashDiscount = props.form.paymentConfig?.cashDiscount || 0

    return [
      {
        key: 'escopo',
        label: 'Escopo',
        met: scopeHasDescriptions.value,
        points: scopeHasDescriptions.value ? 5 : 0,
        detail: scopeHasDescriptions.value
          ? `${props.form.items.length} item(ns), todos com descrição preenchida`
          : 'Há item(ns) sem descrição preenchida',
        tip: scopeHasDescriptions.value ? null : 'Descrever cada item do escopo deixa claro pro cliente o que está incluso e reduz dúvidas.'
      },
      {
        key: 'prazo',
        label: 'Prazo',
        met: !!props.form.executionDate,
        points: props.form.executionDate ? 5 : 0,
        detail: props.form.executionDate ? 'Data de execução definida' : 'Sem data de execução prevista',
        tip: props.form.executionDate ? null : 'Definir uma data de previsão de entrega reduz a ansiedade do cliente e passa segurança.'
      },
      {
        key: 'opcoes',
        label: 'Opções',
        met: upsellCount > 0,
        points: upsellCount > 0 ? 6 : 0,
        detail: upsellCount > 0 ? `${upsellCount} opcional(is) ofertado(s)` : 'Nenhum opcional (upsell) ofertado',
        tip: upsellCount > 0 ? null : 'Oferecer 1 ou 2 serviços opcionais (upsells) eleva o faturamento médio e dá opções ao cliente.'
      },
      {
        key: 'preco',
        label: 'Preço x Parcelamento',
        met: !priceInstallmentMismatch.value,
        points: priceInstallmentMismatch.value ? -12 : (priceInstallmentGood.value ? 5 : 0),
        detail: priceInstallmentMismatch.value
          ? `Valor de R$ ${props.finalTotal.toLocaleString('pt-BR')} com poucas parcelas (${props.form.paymentConfig?.installments || 1}x)`
          : 'Parcelamento coerente com o valor total',
        tip: priceInstallmentMismatch.value ? 'Para projetos acima de R$ 5.000,00, oferecer parcelamento em até 6x facilita a decisão do cliente.' : null
      },
      {
        key: 'condicoes',
        label: 'Condições de Pagamento',
        met: cashDiscount >= 5,
        points: cashDiscount >= 5 ? 8 : 0,
        detail: cashDiscount >= 5 ? `${cashDiscount}% de desconto à vista` : 'Sem desconto à vista',
        tip: cashDiscount >= 5 ? null : 'Adicionar um desconto à vista de pelo menos 5% estimula o pagamento rápido.'
      },
      {
        key: 'dadosCliente',
        label: 'Dados do Cliente',
        met: !!props.form.client?.phone,
        points: props.form.client?.phone ? 4 : 0,
        detail: props.form.client?.phone ? 'Telefone/WhatsApp informado' : 'Sem telefone/WhatsApp informado',
        tip: props.form.client?.phone ? null : 'Adicionar o telefone/WhatsApp do cliente facilita o contato e o follow-up.'
      }
    ]
  })

  const score = computed(() => {
    const base = 75 + scoreCriteria.value.reduce((acc, c) => acc + c.points, 0)
    return Math.min(98, Math.max(45, base))
  })

  const metCriteriaCount = computed(() => scoreCriteria.value.filter(c => c.met).length)
  const totalCriteriaCount = computed(() => scoreCriteria.value.length)

  const scoreLabel = computed(() => `${metCriteriaCount.value} de ${totalCriteriaCount.value} critérios otimizados`)

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
    if (val >= 70) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
    return 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
  }

  return {
    selectedClient,
    getSendMethodLabel,
    scoreCriteria,
    score,
    scoreLabel,
    getScoreColor,
    SendMethod,
    User,
    Calendar,
    CreditCard,
    Mail,
    LinkIcon,
    AlertCircle,
    Sparkles,
    CheckCircle2,
    ShieldAlert,
    Circle,
    Clock
  }
}
