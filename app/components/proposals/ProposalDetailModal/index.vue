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
      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            type="button"
            class="p-2 text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[0.75rem] transition-all cursor-pointer"
            title="Mais ações" aria-label="Mais ações do orçamento">
            <MoreVertical class="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent align="end" :side-offset="6"
            class="min-w-[220px] bg-white dark:bg-gray-950 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-[9999]">
            <DropdownMenuItem @click="emit('history', proposal)"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer outline-none transition-all">
              <History class="w-4 h-4 text-gray-500" />
              Ver Histórico
            </DropdownMenuItem>
            <DropdownMenuItem @click="emit('downloadPdf', proposal)"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer outline-none transition-all">
              <Download class="w-4 h-4 text-gray-500" />
              Baixar Orçamento
            </DropdownMenuItem>
            <DropdownMenuItem v-if="proposal.status !== 'draft' && proposal.status !== 'accepted'"
              :disabled="isResending === proposal._id" @click="emit('resendEmail', proposal)"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer outline-none transition-all disabled:opacity-50">
              <RefreshCcw v-if="isResending === proposal._id" class="w-4 h-4 animate-spin text-gray-500" />
              <Mail v-else class="w-4 h-4 text-gray-500" />
              Reenviar E-mail
            </DropdownMenuItem>
            <DropdownMenuItem v-if="proposal.status !== 'accepted'" @click="emit('edit', proposal)"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer outline-none transition-all">
              <Pencil class="w-4 h-4 text-gray-500" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem v-if="proposal.client?.phone" @click.prevent="openWhatsApp" 
            class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer outline-none transition-all">
              <img src="/images/icons/whatsapp-svg.svg" class="w-4 h-4 text-gray-500 grayscale"  alt="WhatsApp" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem v-if="proposal.status === 'pending'" @click="emit('editContract', proposal)"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer outline-none transition-all">
              <FileText class="w-4 h-4 text-gray-500" />
              Editar Contrato
            </DropdownMenuItem>
            <DropdownMenuItem v-if="proposal.status !== 'accepted'" @click="emit('delete', proposal)"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.75rem] text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300 cursor-pointer outline-none transition-all">
              <Trash2 class="w-4 h-4 text-red-500" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </template>
    <div v-if="proposal" class="space-y-6 py-2 proposal-detail-modal-container">
      <!-- ─── HEADER COMERCIAL ─────────────────────────────────────────── -->
      <div
        class="pb-6 border-dashed border-b border-gray-200 dark:border-gray-800 text-white space-y-4 relative overflow-hidden">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div class="space-y-1">
            <div class="flex items-center gap-3 flex-wrap">
              <BaseBadge variant="ia" v-if="proposal.aiAssisted">
                <Sparkles class="w-3 h-3 mr-1" />
                IA
              </BaseBadge>
              <BaseBadge :variant="currentStatus.variant">
                {{ currentStatus.label }}
              </BaseBadge>

            </div>
            <h2 class="text-xl md:text-2xl font-black dark:text-white text-gray-800 tracking-tight pt-1">
              {{ proposal.title }}
            </h2>
          </div>

          <!-- Ações Rápidas em Destaque -->
          <div class="flex items-center gap-2 flex-wrap shrink-0">
            <div class="flex flex-row justify-between gap-2 sm:w-auto w-full">
              <BaseButton type="button" @click="copyPublicLink" :disabled="!canOpenPublicLink" variante="ghost"
                size="sm"
                class="w-full sm:w-auto inline-flex items-center px-3 py-2 rounded-[0.50rem] text-xs font-bold transition-all border"
                :title="canOpenPublicLink
                    ? 'Copiar Link Público'
                    : 'Disponível apenas após o envio da proposta'
                  ">
                <Copy class="w-4 h-4 mr-2" /> Copiar Link
              </BaseButton>
              <BaseButton type="button" @click="openPublicLink" :disabled="!canOpenPublicLink" variante="ghost"
                size="sm"
                class="w-full sm:w-auto inline-flex items-center px-3 py-2 rounded-[0.50rem] text-xs font-bold transition-all border"
                :title="canOpenPublicLink
                    ? 'Abrir Visão do Cliente'
                    : 'Disponível apenas após o envio da proposta'
                  ">
                <ExternalLink class="w-4 h-4 mr-1.5" /> Abrir Link
              </BaseButton>
            </div>
            <BaseButton v-if="
              !proposal.signature?.status ||
              proposal.signature?.status === ProposalSignatureStatus.NONE
            " type="button" @click="requestDigitalSignature" :disabled="isRequestingSignature"
              :loading="isRequestingSignature" variant="solid" size="sm"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[0.50rem] text-xs font-black uppercase tracking-wider transition-all border-none bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
              title="Enviar documento para assinatura no Assinafy">
              <FileText class="w-4 h-4 mr-1" />
              Enviar para assinar
            </BaseButton>
          </div>
        </div>
      </div>

      <!-- ─── CARDS DE MÉTRICAS COMERCIAIS ────────────────────────────── -->
      <div class="grid rid-cols-2g md:grid-cols-4 gap-4">
        <!-- Valor Total -->
        <div
          class="p-4 rounded-[0.75rem] bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-1">
          <div class="flex items-center justify-between text-gray-400 dark:text-gray-500">
            <span class="text-[10px] font-black uppercase tracking-wider">Valor Total</span>
            <DollarSign class="w-4 h-4 text-gray-500" />
          </div>
          <p class="text-xl font-black text-gray-900 dark:text-gray-100 truncate">
            {{ formatCurrency(calculatedTotal) }}
          </p>
          <p v-if="calculatedDiscount" class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">
            Desc: {{ formatCurrency(calculatedDiscount) }}
          </p>
          <p v-else class="text-[10px] text-gray-400 font-medium truncate">
            Sem desconto aplicado
          </p>
        </div>

        <!-- Validade -->
        <div
          class="p-4 rounded-[0.75rem] bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-1">
          <div class="flex items-center justify-between text-gray-400 dark:text-gray-500">
            <span class="text-[10px] font-black uppercase tracking-wider">Criado em</span>
            <Calendar class="w-4 h-4 text-gray-500" />
          </div>
          <p class="text-sm font-black text-gray-900 dark:text-gray-100 truncate">
            {{ formatDate(proposal.createdAt) }}
          </p>
          <p class="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
            Validade:
            {{ expirationDate ? formatDate(expirationDate) : "Indefinida" }}
          </p>
        </div>

        <!-- Engajamento / Visualizações -->
        <div
          class="p-4 rounded-[0.75rem] bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1">
          <div class="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Visualizações</span>
            <Eye class="w-4 h-4 text-amber-500" />
          </div>
          <p class="text-xl font-black text-amber-900 dark:text-amber-200">
            {{ calculatedViewsCount }}x
          </p>
          <p class="text-[10px] text-amber-700 dark:text-amber-300 font-bold truncate">
            {{
              calculatedLastViewedAt
                ? `Última: ${formatDate(calculatedLastViewedAt)}`
                : "Nunca visualizado"
            }}
          </p>
        </div>

        <!-- Mensagens Chat -->
        <div
          class="p-4 rounded-[0.75rem] bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 space-y-1">
          <div class="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span class="text-[10px] font-black uppercase tracking-wider">Mensagens Chat</span>
            <MessageSquare class="w-4 h-4 text-indigo-500" />
          </div>
          <p class="text-xl font-black text-indigo-900 dark:text-indigo-200">
            {{ (proposal as any).unreadMessages || 0 }}
            <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400">não lidas</span>
          </p>
          <p class="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium truncate">
            {{
              (proposal as any).hasMessages
                ? "Chat ativo pelo cliente"
                : "Nenhuma mensagem"
            }}
          </p>
        </div>
      </div>

      <div class="w-full flex grid md:grid-cols-12 grid-cols-1 gap-4">
        <div class="sm:w-full md:col-span-7">
          <!-- ─── DADOS DO CLIENTE VINCULADO ───────────────────────────────── -->
          <div
            class="p-5 rounded-[0.75rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3 mb-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
              <span
                class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User class="w-4 h-4 text-blue-500" /> Cliente Solicitante
              </span>
              <span v-if="proposal.client?.taxId"
                class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                {{ proposal.client.taxId }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Nome / Razão
                  Social</span>
                <span class="font-black text-gray-900 dark:text-gray-100">{{
                  proposal.client?.name || "Cliente não informado"
                  }}</span>
              </div>

              <div>
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">E-mail</span>
                <a v-if="proposal.client?.email" :href="`mailto:${proposal.client.email}`"
                  class="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  <Mail class="w-3.5 h-3.5" /> {{ proposal.client.email }}
                </a>
                <span v-else class="text-gray-400 italic text-xs">Não informado</span>
              </div>

              <div>
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Telefone /
                  WhatsApp</span>
                <a v-if="proposal.client?.phone" @click.prevent="openWhatsApp" href="#"
                  class="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                  <Phone class="w-3.5 h-3.5" />
                  {{ formatPhone(proposal.client.phone) }}
                </a>
                <span v-else class="text-gray-400 italic text-xs">Não informado</span>
              </div>
            </div>
          </div>

          <!-- ─── ESCOPO DE ITENS E SERVIÇOS INCLUÍDOS ──────────────────────── -->
          <div
            class="p-5 rounded-[0.75rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4">
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <span
                class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Package class="w-4 h-4 text-blue-500" /> Itens e Serviços do
                Escopo ({{ proposal.items?.length || 0 }})
              </span>
              <span class="text-xs font-black text-gray-900 dark:text-white">
                Subtotal: {{ formatCurrency(calculatedSubtotal) }}
              </span>
            </div>

            <div v-if="proposal.items && proposal.items.length > 0" class="space-y-3">
              <div v-for="(item, idx) in proposal.items" :key="idx"
                class="flex items-center justify-between gap-4 p-3.5 rounded-[0.50rem] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                <div class="flex items-center gap-4 min-w-0">
                  <div
                    class="w-12 h-12 rounded-[0.50rem] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    <BaseImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                      container-class="w-full h-full" img-class="w-full h-full object-cover" />
                    <Package v-else class="w-6 h-6 text-gray-400" />
                  </div>
                  <div class="min-w-0">
                    <p class="font-black text-gray-900 dark:text-gray-100 text-sm truncate">
                      {{ item.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
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
          </div>
        </div>
        <div class="sm:w-full md:col-span-5">
          <!-- ─── RESUMO FINANCEIRO & PAGAMENTO ────────────────────────── -->
          <div
            class="p-5 rounded-[0.75rem] bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 border border-gray-200 dark:border-gray-800 space-y-4">
            <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <span
                class="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2">
                <CreditCard class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Financeiro
              </span>
              <BaseBadge variant="price">
                {{ paymentTermsText }}
              </BaseBadge>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div
                class="space-y-1 p-3 rounded-[0.50rem] bg-gray-200 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Subtotal</span>
                <span class="font-black text-gray-900 dark:text-gray-100 text-sm">{{ formatCurrency(calculatedSubtotal)
                  }}</span>
              </div>

              <div
                class="space-y-1 p-3 rounded-[0.50rem] bg-gray-200 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Desconto</span>
                <span class="font-black text-gray-900 dark:text-emerald-400 text-sm">
                  {{
                    calculatedDiscount > 0
                      ? `- ${formatCurrency(calculatedDiscount)}`
                      : "R$ 0,00"
                  }}
                </span>
              </div>

              <div
                class="space-y-1 p-3 rounded-[0.50rem] bg-gray-200 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Acréscimos /
                  Taxas</span>
                <span class="font-black text-gray-900 dark:text-amber-400 text-sm">
                  {{
                    calculatedAdditional > 0
                      ? `+ ${formatCurrency(calculatedAdditional)}`
                      : "R$ 0,00"
                  }}
                </span>
              </div>
            </div>
            <div class="space-y-1 p-3 rounded-[0.50rem] bg-indigo-600 text-white shadow-md w-full">
              <span class="text-md font-black text-indigo-200 uppercase tracking-wider block">Valor Líquido</span>
              <span class="font-black text-white text-3xl font-mono tracking-wide">{{ formatCurrency(calculatedTotal)
                }}</span>
            </div>
          </div>
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
