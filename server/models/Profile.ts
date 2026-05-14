import { Schema, model } from 'mongoose'

const profileSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
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
  creditsBalance: { type: Number, default: 1 },
  creditsUsed: { type: Number, default: 0 },
  subscriptionPlan: { type: String, enum: ['free', 'starter', 'premium'], default: 'free' },
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  password: { type: String, select: false },
  isEmailVerified: { type: Boolean, default: false },
  defaultValidityDays: { type: Number, default: 7 },
  defaultInstallments: { type: Number, default: 1 },
  defaultCashDiscount: { type: Number, default: 0 },
  defaultContractTemplate: { type: String, default: '<h2>Contrato de Prestação de Serviços</h2><p>Pelo presente instrumento, {{nome_empresa}} se compromete a realizar os serviços para {{nome_cliente}} conforme detalhado nesta proposta.</p>' },
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
Para dirimir quaisquer controvérsias oriundas desta proposta, fica eleito o foro da comarca de Belo Horizonte, Estado de Minas Gerais, renunciando as partes a qualquer outro, por mais privilegiado que seja.</p>` }
}, { timestamps: true })

export const Profile = model('Profile', profileSchema)
