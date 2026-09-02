<script setup lang="ts">
import type { ProposalDTO } from "~/types";
import { History, Download, RefreshCcw, Trash2 } from "lucide-vue-next";
import { useProposalDetailModal } from "./index";

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
  (e: "renew", proposal: ProposalDTO): void;
  (e: "delete", proposal: ProposalDTO): void;
}>();

const {
  currentStatus,
  can,
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
  Package,
  Sparkles,
  Clock,
} = useProposalDetailModal(props, emit);

const drawerTitle = () => props.proposal?.title || "Orçamento"
const drawerDescription = () => {
  const p = props.proposal
  if (!p) return ""
  return `${p.client?.name || "Cliente não informado"} • ${p.code || ""}`
}
</script>

<template>
  <BaseDrawer
    :open="open"
    @update:open="(val) => emit('update:open', val)"
    :title="drawerTitle()"
    :description="drawerDescription()"
    position="right"
    size="xl"
  >
    <!-- Menu de contexto (header) -->
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
          v-if="can('resend')"
          :disabled="isResending === proposal._id"
          @click="emit('resendEmail', proposal)"
        >
          <RefreshCcw v-if="isResending === proposal._id" class="w-4 h-4 animate-spin text-gray-500" />
          <Mail v-else class="w-4 h-4 text-gray-500" />
          <span>Reenviar E-mail</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem v-if="can('edit')" @click="emit('edit', proposal)">
          <Pencil class="w-4 h-4 text-gray-500" />
          <span>Editar</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem
          v-if="proposal.client?.phone && can('whatsapp')"
          :href="`https://wa.me/55${proposal.client.phone.replace(/\D/g, '')}`"
          target="_blank"
        >
          <img src="/images/icons/whatsapp-svg.svg" class="w-4 h-4 grayscale" alt="WhatsApp" />
          <span>WhatsApp</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem v-if="can('edit_contract')" @click="emit('editContract', proposal)">
          <FileText class="w-4 h-4 text-gray-500" />
          <span>Editar Contrato</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem v-if="can('renew')" @click="emit('renew', proposal)">
          <RefreshCcw class="w-4 h-4 text-amber-500" />
          <span>Renovar / Reenviar</span>
        </BaseDropdownMenuItem>
        <BaseDropdownMenuItem v-if="can('delete')" variant="danger" @click="emit('delete', proposal)">
          <Trash2 class="w-4 h-4 text-red-500" />
          <span>Excluir</span>
        </BaseDropdownMenuItem>
      </BaseDropdownMenu>
    </template>

    <div v-if="proposal" class="space-y-6 proposal-detail-modal-container">
      <!-- ─── FASE ATUAL ─── -->
      <div>
        <ProposalPhaseStepper :status="proposal.status" :signature-status="proposal.signature?.status ?? null" size="md" />
      </div>

      <!-- ─── STATUS + AÇÕES RÁPIDAS ─── -->
      <div class="flex flex-wrap items-center gap-2">
        <BaseBadge :variant="currentStatus.variant" light>{{ currentStatus.label }}</BaseBadge>
        <BaseBadge variant="ia" v-if="proposal.aiAssisted">
          <Sparkles class="w-3 h-3 mr-1" /> IA
        </BaseBadge>

        <div class="flex-1" />

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
        <BaseButton
          v-if="can('request_signature') && proposal.signature?.status !== ProposalSignatureStatus.PENDING"
          type="button" @click="requestDigitalSignature" :disabled="isRequestingSignature" :loading="isRequestingSignature"
          variant="solid" size="sm"
          class="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[.5rem] text-xs font-black uppercase tracking-wider transition-all border-none bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
          title="Enviar documento para assinatura no Assinafy">
          <FileText class="w-4 h-4 mr-1" /> Assinar
        </BaseButton>
      </div>

      <!-- ─── MÉTRICAS RESUMIDAS ─── -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-4 rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <DollarSign class="w-3.5 h-3.5" /> Total
          </span>
          <p class="mt-1 text-xl font-black text-gray-900 dark:text-gray-50">{{ formatCurrency(calculatedTotal) }}</p>
          <p v-if="calculatedDiscount" class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            Desc: {{ formatCurrency(calculatedDiscount) }}
          </p>
        </div>
        <div class="p-4 rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar class="w-3.5 h-3.5" /> Criado em
          </span>
          <p class="mt-1 text-sm font-bold text-gray-900 dark:text-gray-50">{{ formatDate(proposal.createdAt) }}</p>
          <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            Validade: {{ expirationDate ? formatDate(expirationDate) : "Indefinida" }}
          </p>
        </div>
        <div class="p-4 rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <MessageSquare class="w-3.5 h-3.5" /> Chat
          </span>
          <p class="mt-1 text-xl font-black text-gray-900 dark:text-gray-50">{{ (proposal as any).unreadMessages || 0 }}</p>
          <p class="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {{ (proposal as any).hasMessages ? "Chat ativo pelo cliente" : "Nenhuma mensagem" }}
          </p>
        </div>
      </div>

      <!-- ─── ITENS DO ESCOPO ─── -->
      <section>
        <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3">
          Itens e Serviços ({{ proposal.items?.length || 0 }})
        </h4>
        <div v-if="proposal.items && proposal.items.length > 0" class="space-y-2">
          <div v-for="(item, idx) in proposal.items" :key="idx"
            class="flex items-center justify-between gap-4 p-3.5 rounded-[.5rem] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
            <div class="flex items-center gap-4 min-w-0">
              <div
                class="w-12 h-12 rounded-[.5rem] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 items-center justify-center hidden sm:flex">
                <BaseImage v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name"
                  container-class="w-full h-full" img-class="w-full h-full object-cover" />
                <Package v-else class="w-6 h-6 text-gray-400" />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{{ item.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-base">
                  {{ item.description || "Sem descrição" }}
                </p>
              </div>
            </div>
            <div class="text-right shrink-0">
              <span class="font-black text-gray-900 dark:text-gray-100 text-sm block">
                {{ formatCurrency((item.price || 0) * (item.quantity || 1)) }}
              </span>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {{ item.quantity || 1 }}x {{ formatCurrency(item.price) }} / {{ item.unit || "un" }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-6 text-gray-400 text-xs font-bold uppercase tracking-wider">
          Nenhum item adicionado a este orçamento.
        </div>
      </section>

      <!-- ─── RESUMO FINANCEIRO ─── -->
      <section>
        <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3">Financeiro</h4>
        <div class="rounded-[.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div class="grid grid-cols-2 gap-px bg-gray-100 dark:bg-gray-800">
            <div class="bg-white dark:bg-gray-900 p-4">
              <span class="text-[10px] font-semibold text-gray-400 tracking-wide block">Subtotal</span>
              <span class="font-bold text-gray-900 dark:text-gray-100 text-sm">{{ formatCurrency(calculatedSubtotal) }}</span>
            </div>
            <div class="bg-white dark:bg-gray-900 p-4">
              <span class="text-[10px] font-semibold text-gray-400 tracking-wide block">Desconto</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {{ calculatedDiscount > 0 ? `- ${formatCurrency(calculatedDiscount)}` : "R$ 0,00" }}
              </span>
            </div>
            <div class="bg-white dark:bg-gray-900 p-4">
              <span class="text-[10px] font-semibold text-gray-400 tracking-wide block">Acréscimos / Taxas</span>
              <span class="font-bold text-amber-600 dark:text-amber-400 text-sm">
                {{ calculatedAdditional > 0 ? `+ ${formatCurrency(calculatedAdditional)}` : "R$ 0,00" }}
              </span>
            </div>
            <div class="bg-white dark:bg-gray-900 p-4">
              <span class="text-[10px] font-semibold text-gray-400 tracking-wide block">Condições</span>
              <span class="font-bold text-gray-900 dark:text-gray-100 text-sm">{{ paymentTermsText }}</span>
            </div>
          </div>
          <div class="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between">
            <span class="text-xs font-black text-indigo-200 uppercase tracking-wider">Valor Líquido</span>
            <span class="font-black text-white text-2xl font-mono tracking-wide">{{ formatCurrency(calculatedTotal) }}</span>
          </div>
        </div>
      </section>

      <!-- ─── CLIENTE ─── -->
      <section>
        <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3">Cliente</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="p-4 rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
            <span class="text-[10px] font-semibold text-gray-400 tracking-wider block">E-mail</span>
            <a v-if="proposal.client?.email" :href="`mailto:${proposal.client.email}`"
              class="font-base text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-1 mt-0.5">
              <Mail class="w-3.5 h-3.5" /> {{ proposal.client.email }}
            </a>
            <span v-else class="text-gray-400 italic text-xs">Não informado</span>
          </div>
          <div class="p-4 rounded-[.5rem] border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40">
            <span class="text-[10px] font-semibold text-gray-400 tracking-wider block">Telefone / WhatsApp</span>
            <a v-if="proposal.client?.phone && can('whatsapp')" @click.prevent="openWhatsApp" href="#"
              class="font-base text-gray-600 dark:text-gray-400 hover:underline flex items-center gap-1 mt-0.5 cursor-pointer">
              <Phone class="w-3.5 h-3.5" /> {{ formatPhone(proposal.client.phone) }}
            </a>
            <span v-else class="text-gray-400 italic text-xs">Não informado</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Footer: CTAs principais -->
    <template #footer v-if="proposal">
      <BaseButton
        v-if="proposal.client?.phone && can('whatsapp')"
        type="button"
        variant="whatsapp"
        class="flex-1"
        @click.prevent="openWhatsApp"
      >
        <img src="/images/icons/whatsapp-svg.svg" class="w-4 h-4 mr-2" alt="WhatsApp" />
        WhatsApp
      </BaseButton>
      <BaseButton v-if="can('edit')" type="button" class="flex-1" @click="emit('edit', proposal)">
        <Pencil class="w-4 h-4 mr-2" />
        Editar
      </BaseButton>
      <BaseButton
        v-if="can('download')"
        type="button"
        variant="secondary"
        class="flex-1"
        @click="emit('downloadPdf', proposal)"
      >
        <Download class="w-4 h-4 mr-2" />
        Baixar PDF
      </BaseButton>
    </template>
  </BaseDrawer>
</template>

<style scoped src="./index.css"></style>