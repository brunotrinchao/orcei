import { Schema, model } from 'mongoose'
import { SubscriptionPlan, SubscriptionStatus, UserRole } from '../../types/enums'

const profileSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  avatar: String,
  brandConfig: {
    logoUrl: String,
    primaryColor: { type: String, default: '#3B82F6' }
  },
  address: {
    street: String,
    number: String,
    neighborhood: String,
    city: String,
    state: String,
    zip: String
  },
  company: {
    taxId: String,
    legalName: String,
    tradeName: String
  },
  contact: {
    phones: [{
      number: String,
      isWhatsapp: { type: Boolean, default: false }
    }],
    social: {
      instagram: String,
      youtube: String,
      facebook: String,
      twitter: String
    }
  },
  creditsBalance: { type: Number, default: 5 },
  creditsUsed: { type: Number, default: 0 },
  redeemedCoupons: { type: [String], default: [] },
  aiUsage: {
    reports: { type: Number, default: 0 },
    proposals: { type: Number, default: 0 },
    catalog: { type: Number, default: 0 },
    leads: { type: Number, default: 0 }
  },
  subscriptionPlan: { type: String, enum: Object.values(SubscriptionPlan), default: SubscriptionPlan.FREE },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  subscriptionStatus: {
    type: String,
    enum: [...Object.values(SubscriptionStatus), null],
    default: null
  },
  subscriptionEndsAt: { type: Date, default: null },
  cancelAtPeriodEnd: { type: Boolean, default: false },
  stripePriceId: { type: String, default: null },
  defaultValidityDays: { type: Number, default: 7 },
  defaultInstallments: { type: Number, default: 1 },
  defaultCashDiscount: { type: Number, default: 0 },
  defaultContractTemplate: { type: String, default: `<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS</h2><p>

ENTRE:

CONTRATANTE (CLIENTE): {nome_cliente}, doravante designado apenas por Contratante.

E

CONTRATADO (PRESTADOR/FREELANCER): {nome_fantasia} (Razão Social: {razao_social}), com sede em {rua}, {numero}, {bairro}, {cidade} - {estado}, CEP: {cep}, titular do CNPJ {cnpj}, telefone {telefone}, doravante designado apenas por Contratado.

As partes, agindo de boa-fé, acordam e celebram o presente Contrato de Prestação de Serviços, que se regerá pelas seguintes cláusulas:

CLÁUSULA 1ª (Objeto do Contrato) O presente contrato tem como objeto a prestação de serviços por parte do Contratado ao Contratante, conforme detalhado na proposta comercial aprovada a qual este documento integra.

CLÁUSULA 2ª (Regime de Trabalho e Autonomia) O Contratado executará as suas funções com total autonomia técnica e organizativa, não existindo qualquer vínculo laboral ou relação de subordinação jurídica entre as partes. O trabalho será realizado em regime remoto, utilizando o Contratado os seus próprios equipamentos e ferramentas de trabalho.

CLÁUSULA 3ª (Prazos e Entregas) O presente contrato entra em vigor na data da sua assinatura e terá a duração de {dias_validade} dias, ou a duração necessária para a conclusão dos serviços acordados.

CLÁUSULA 4ª (Preço e Forma de Pagamento) Como contrapartida pelos serviços prestados, o Contratante pagará ao Contratado o valor total de R$ {valor_total}. O pagamento será efetuado através da modalidade: {forma_pagamento}. Detalhes adicionais de pagamento estipulados: {detalhes_pagamento}.

O Contratado emitirá a respectiva Nota Fiscal de Serviços após a compensação de cada pagamento.

CLÁUSULA 5ª (Propriedade Intelectual) Os direitos de propriedade intelectual dos materiais criados no âmbito deste contrato serão transmitidos em exclusivo para o Contratante apenas e só após o pagamento integral do valor acordado na Cláusula 4ª.

CLÁUSULA 6ª (Confidencialidade) Ambas as partes obrigam-se a manter sigilo absoluto sobre todas as informações comerciais, técnicas ou dados pessoais a que tenham acesso durante a vigência deste contrato, não os podendo divulgar a terceiros sem autorização prévia por escrito.

CLÁUSULA 7ª (Rescisão) Qualquer uma das partes poderá rescindir o presente contrato mediante aviso prévio por escrito com a antecedência mínima de 15 dias. Em caso de rescisão por iniciativa do Contratante sem justa causa, os valores já pagos a título de sinal ou setup não serão devolvidos.

CLÁUSULA 8ª (Lei Aplicável e Foro) Para a resolução de qualquer litígio emergente deste contrato, as partes elegem o foro da comarca de {cidade} / {estado}.

Por estarem de pleno acordo, as partes concordam com os termos supracitados na aceitação deste orçamento.</p>` },
  defaultTermsAndConditions: { type: String, default: `<h2>Termos e Condições de Contratação</h2>
<p><strong>1. Validade do Orçamento</strong><br>
A presente proposta comercial tem validade de {{dias_validade}} dias contados a partir da data de sua emissão. Após este prazo, os valores e prazos estipulados estarão sujeitos a revisão e reajuste.</p>

<p><strong>2. Escopo dos Serviços Contratados</strong><br>
Os valores apresentados cobrem estritamente os serviços e entregáveis descritos nos itens aprovados neste orçamento. Quaisquer solicitações de alterações, adições de funcionalidades ou revisões que fujam ao escopo detalhado acima serão tratadas como serviços adicionais e orçadas à parte, mediante aprovação prévia do cliente.</p>

<p><strong>3. Prazos de Execução</strong><br>
O prazo de entrega acordado passará a ser contabilizado apenas após a confirmação do pagamento do sinal (quando aplicável) e o envio, por parte do cliente, de todos os materiais, acessos e informações essenciais para o início dos trabalhos. Atrasos na entrega destes insumos isentam o profissional do cumprimento do prazo original.</p>

<p><strong>4. Condições de Pagamento e Inadimplência</strong><br>
O aceite desta proposta caracteriza a concordância com os valores e formas de pagamento nela dispostos. Em caso de atraso superior a 5 (cinco) dias úteis no pagamento de qualquer parcela, o andamento do projeto poderá ser suspenso. Atrasos superiores a 30 (trinta) dias implicarão em multa moratória de 2% e juros de 1% ao mês.</p>

<p><strong>5. Cancelamento e Rescisão</strong><br>
Em caso de desistência por parte do cliente após o aceite e início dos trabalhos, os valores já pagos referentes a etapas concluídas ou horas já trabalhadas não serão reembolsados. Caso o projeto seja cancelado sem que nenhuma hora tenha sido consumida, um acordo de devolução do sinal será negociado, retendo-se taxas administrativas.</p>

<p><strong>6. Propriedade Intelectual</strong><br>
Os direitos autorais e patrimoniais sobre o trabalho final serão integralmente transferidos ao cliente apenas após a quitação total dos valores descritos neste orçamento.</p>

<p><strong>7. Foro de Eleição</strong><br>
Para dirimir quaisquer controvérsias oriundas desta proposta, fica eleito o foro da comarca de Belo Horizonte, Estado de Minas Gerais, renunciando as partes a qualquer outro, por mais privilegiado que seja.</p>` },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
  purgeScheduledAt: { type: Date, default: null },
  role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
  lastLoginAt: { type: Date, default: null },
  onboardingCompletedTours: { type: [String], default: [] },
  onboardingWelcomeSeen: { type: Boolean, default: false },
  googleIntegration: {
    email: String,
    accessToken: String,
    refreshToken: String,
    expiryDate: Number,
    driveFolderId: String
  }
}, { timestamps: true })

profileSchema.index({ userId: 1, isDeleted: 1 })
profileSchema.index({ stripeCustomerId: 1 }, { sparse: true })
profileSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } })

export const Profile = model('Profile', profileSchema)
