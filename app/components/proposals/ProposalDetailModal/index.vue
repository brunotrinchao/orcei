<script setup lang="ts">
import type { ProposalDTO } from "~/types";
import { useProposalDetailModal } from "./index";
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
} from "radix-vue";
import {
  MoreVertical,
  History,
  Download,
  RefreshCcw,
  Trash2,
} from "lucide-vue-next";

const props = defineProps<{
  open: boolean;
  proposal: ProposalDTO | null;
  isResending?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
  (e: "edit", proposal: ProposalDTO): void;
  (e: "history", proposal: ProposalDTO): void;
  (e: "downloadPdf", proposal: ProposalDTO): void;
  (e: "resendEmail", proposal: ProposalDTO): void;
  (e: "editContract", proposal: ProposalDTO): void;
  (e: "delete", proposal: ProposalDTO): void;
}>();

const {
  currentStatus,
  calculatedViewsCount,
  calculatedLastViewedAt,
  canOpenPublicLink,
  copyPublicLink,
  openPublicLink,
  openWhatsApp,
  formatCurrency,
  formatDate,
  formatPhone,
  calculatedSubtotal,
  calculatedAdditional,
  calculatedDiscount,
  calculatedTotal,
  expirationDate,
  paymentTermsText,
  isRequestingSignature,
  requestDigitalSignature,
  ProposalSignatureStatus,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  MessageSquare,
  ExternalLink,
  Copy,
  Pencil,
  Mail,
  Phone,
  User,
  Package,
  Sparkles,
  CreditCard,
  CheckCheck,
  Clock,
} = useProposalDetailModal(props, emit);
</script>

<template>
  <BaseDialog :open="open" @update:open="(val) => emit('update:open', val)" :title="'Orçamento'" size="xl">
    <template #context-menu v-if="proposal">
      <BaseDropdownMenu>
        <BaseDropdownMenuItem @click="emit('history', proposal)">
          <History class="w-4 h-4 text-gray-500" />
          <span>Ver Histórico</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem @click="emit('downloadPdf', proposal)">
          <Download class="w-4 h-4 text-gray-500" />
          <span>Baixar Orçamento</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem
          v-if="proposal.status !== 'draft' && proposal.status !== 'accepted'"
          :disabled="isResending === proposal._id"
          @click="emit('resendEmail', proposal)"
        >
          <RefreshCcw v-if="isResending === proposal._id" class="w-4 h-4 animate-spin text-gray-500" />
          <Mail v-else class="w-4 h-4 text-gray-500" />
          <span>Reenviar E-mail</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem v-if="proposal.status !== 'accepted'" @click="emit('edit', proposal)">
          <Pencil class="w-4 h-4 text-gray-500" />
          <span>Editar</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem
          v-if="proposal.client?.phone"
          :href="`https://wa.me/55${proposal.client.phone.replace(/\D/g, '')}`"
          target="_blank"
        >
          <img src="/images/icons/whatsapp-svg.svg" class="w-4 h-4 grayscale" alt="WhatsApp" />
          <span>WhatsApp</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem v-if="proposal.status === 'pending'" @click="emit('editContract', proposal)">
          <FileText class="w-4 h-4 text-gray-500" />
          <span>Editar Contrato</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem
          v-if="proposal.status !== 'accepted'"
          variant="danger"
          @click="emit('delete', proposal)"
        >
          <Trash2 class="w-4 h-4 text-red-500" />
          <span>Excluir</span>
        </BaseDropdownMenuItem>
      </BaseDropdownMenu>
    </template>
    <div v-if="proposal" class="space-y-6 py-2 proposal-detail-modal-container">
      <!-- ─── HEADER COMERCIAL (Padronizado com BaseCard compact color="slate") ─── -->
      <BaseCard compact color="slate">
        <div class="flex gap-4 items-center content-center">
          <div class="flex gap-2 flex-col sm:flex-row sm:items-center justify-between flex-1 min-w-0">
            <div>
              <h3 class="font-semibold tracking-normal text-lg text-gray-700 dark:text-gray-200">{{ proposal.title }}</h3>
              <p class="font-base tracking-wide text-sm text-gray-500">{{ proposal.client?.name || 'Cliente não informado' }}</p>
              <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                <BaseBadge :variant="currentStatus.variant">
                  {{ currentStatus.label }}
                </BaseBadge>
                <BaseBadge variant="ia" v-if="proposal.aiAssisted">
                  <Sparkles class="w-3 h-3 mr-1" /> IA
                </BaseBadge>
              </div>
            </div>

            <!-- Ações Rápidas -->
            <div class="flex items-center gap-2 flex-wrap shrink-0 mt-2 sm:mt-0">
              <BaseButton type="button" @click="copyPublicLink" :disabled="!canOpenPublicLink" variant="outline" size="sm"
                class="inline-flex items-center px-3 py-2 rounded-[.5rem] text-xs font-bold transition-all"
                :title="canOpenPublicLink ? 'Copiar Link Público' : 'Disponível apenas após o envio da proposta'">
                <Copy class="w-4 h-4 mr-2" /> Copiar Link
              </BaseButton>
              <BaseButton type="button" @click="openPublicLink" :disabled="!canOpenPublicLink" variant="outline" size="sm"
                class="inline-flex items-center px-3 py-2 rounded-[.5rem] text-xs font-bold transition-all"
                :title="canOpenPublicLink ? 'Abrir Visão do Cliente' : 'Disponível apenas após o envio da proposta'">
                <ExternalLink class="w-4 h-4 mr-1.5" /> Abrir Link
              </BaseButton>
              <BaseButton v-if="!proposal.signature?.status || proposal.signature?.status === ProposalSignatureStatus.NONE"
                type="button" @click="requestDigitalSignature" :disabled="isRequestingSignature" :loading="isRequestingSignature"
                variant="solid" size="sm"
                class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[.5rem] text-xs font-black uppercase tracking-wider transition-all border-none bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                title="Enviar documento para assinatura no Assinafy">
                <FileText class="w-4 h-4 mr-1" /> Assinar
              </BaseButton>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- ─── CARDS DE MÉTRICAS COMERCIAIS (BaseMetricCard com variant) ─── -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BaseMetricCard
          color="sky"
          title="Total"
          :subtitle="calculatedDiscount ? `Desc: ${formatCurrency(calculatedDiscount)}` : 'Sem desconto aplicado'"
          :value="formatCurrency(calculatedTotal)"
          :icon="DollarSign"
          variant
        />
        <BaseMetricCard
          color="green"
          title="Criado em"
          :subtitle="`Validade: ${expirationDate ? formatDate(expirationDate) : 'Indefinida'}`"
          :value="formatDate(proposal.createdAt)"
          :icon="Calendar"
          variant
        />
        <!-- <BaseMetricCard
          color="amber"
          title="Visualizações"
          :subtitle="calculatedLastViewedAt ? `Última: ${formatDate(calculatedLastViewedAt)}` : 'Nunca visualizado'"
          :value="`${calculatedViewsCount}x`"
          :icon="Eye"
          variant
        /> -->
        <BaseMetricCard
          color="purple"
          title="Chat"
          :subtitle="(proposal as any).hasMessages ? 'Chat ativo pelo cliente' : 'Nenhuma mensagem'"
          :value="`${(proposal as any).unreadMessages || 0}`"
          :icon="MessageSquare"
          variant
        />
      </div>

      <div class="w-full flex grid md:grid-cols-12 grid-cols-1 gap-4">
        <div class="sm:w-full md:col-span-7 grid grid-cols gap-4">
          <!-- ─── DADOS DO CLIENTE VINCULADO ───────────────────────────────── -->
           <BaseCard compact :title="proposal.client?.name || 'Cliente não informado'">
        
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

              <div>
                <span class="text-[10px] font-semibold text-gray-400 tracking-wider block">E-mail</span>
                <a v-if="proposal.client?.email" :href="`mailto:${proposal.client.email}`"
                  class="font-base text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-1">
                  <Mail class="w-3.5 h-3.5" /> {{ proposal.client.email }}
                </a>
                <span v-else class="text-gray-400 italic text-xs">Não informado</span>
              </div>

              <div>
                <span class="text-[10px] font-semibold text-gray-400 tracking-wider block">Telefone /
                  WhatsApp</span>
                <a v-if="proposal.client?.phone" @click.prevent="openWhatsApp" href="#"
                  class="font-base text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-1 cursor-pointer">
                  <Phone class="w-3.5 h-3.5" />
                  {{ formatPhone(proposal.client.phone) }}
                </a>
                <span v-else class="text-gray-400 italic text-xs">Não informado</span>
              </div>
            </div>
          </BaseCard>

          <BaseCard compact :title="'Itens e Serviços do Escopo (' + (proposal.items?.length || 0 ) + ')'">
          
            <div v-if="proposal.items && proposal.items.length > 0" class="space-y-3">
              <div v-for="(item, idx) in proposal.items" :key="idx"
                class="flex items-center justify-between gap-4 p-3.5 rounded-[.5rem] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                <div class="flex items-center gap-4 min-w-0">
                  <div
                    class="w-12 h-12 rounded-[.5rem] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0  items-center justify-center hidden sm:flex">
                    <BaseImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                      container-class="w-full h-full" img-class="w-full h-full object-cover" />
                    <Package v-else class="w-6 h-6 text-gray-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                      {{ item.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-base">
                      {{ item.description || "Sem descrição" }}
                    </p>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <span class="font-black text-gray-900 dark:text-gray-100 text-sm block">
                    {{
                      formatCurrency((item.price || 0) * (item.quantity || 1))
                    }}
                  </span>
                  <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {{ item.quantity || 1 }}x {{ formatCurrency(item.price) }} /
                    {{ item.unit || "un" }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6 text-gray-400 text-xs font-bold uppercase tracking-wider">
              Nenhum item adicionado a este orçamento.
            </div>
          </BaseCard>

          <!-- ─── ESCOPO DE ITENS E SERVIÇOS INCLUÍDOS ──────────────────────── -->
        </div>
        <div class="sm:w-full md:col-span-5">
          <!-- ─── RESUMO FINANCEIRO & PAGAMENTO ────────────────────────── -->
           <BaseCard compact color="slate" title="Financeiro">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                class="space-y-1 p-3 rounded-[.5rem] bg-gray-200 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                <span class="text-[10px] font-semibold text-gray-400 tracking-wide block">Subtotal</span>
                <span class="font-medium text-gray-900 dark:text-gray-100 text-sm">{{ formatCurrency(calculatedSubtotal)
                  }}</span>
              </div>

              <div
                class="space-y-1 p-3 rounded-[.5rem] bg-gray-200 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                <span class="text-[10px] font-semibold text-gray-400 tracking-wide block">Desconto</span>
                <span class="font-medium text-gray-900 dark:text-emerald-400 text-sm">
                  {{
                    calculatedDiscount > 0
                      ? `- ${formatCurrency(calculatedDiscount)}`
                      : "R$ 0,00"
                  }}
                </span>
              </div>

              <div
                class="space-y-1 p-3 rounded-[.5rem] bg-gray-200 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                <span class="text-[10px] font-semibold text-gray-400 tracking-wide block">Acréscimos /
                  Taxas</span>
                <span class="font-medium text-gray-900 dark:text-amber-400 text-sm">
                  {{
                    calculatedAdditional > 0
                      ? `+ ${formatCurrency(calculatedAdditional)}`
                      : "R$ 0,00"
                  }}
                </span>
              </div>

              <div
                class="space-y-1 p-3 rounded-[.5rem] bg-gray-200 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                <span class="font-medium text-gray-900 dark:text-amber-400 text-sm">
                  {{
                    paymentTermsText
                  }}
                </span>
              </div>
            </div>
            <div class="space-y-1 p-3 mt-4 rounded-[.5rem] bg-indigo-600 text-white shadow-md w-full">
              <span class="text-md font-black text-indigo-200 uppercase tracking-wider block">Valor Líquido</span>
              <span class="font-black text-white text-3xl font-mono tracking-wide">{{ formatCurrency(calculatedTotal)
                }}</span>
            </div>
          </BaseCard>
        </div>
      </div>
    </div>

    <!-- <template #footer>
      <div class="w-full flex flex-row gap-4">
        <BaseButton type="button" v-if="proposal.client?.phone" @click.prevent="openWhatsApp" variant="whatsapp"
          class="flex-1">
          <img src="/images/icons/whatsapp-svg.svg" class="w-4 h-4" alt="WhatsApp" />
          WhatsApp
        </BaseButton>

        <BaseButton v-if="
          proposal &&
          proposal.status !== 'accepted' &&
          proposal.signature?.status !== ProposalSignatureStatus.SIGNED
        " type="button" class="flex-1" @click="emit('edit', proposal)">
          <Pencil class="w-4 h-4 mr-2" />
          Editar
        </BaseButton>
      </div> 
    </template> -->
  </BaseDialog>
</template>

<style scoped src="./index.css"></style>
