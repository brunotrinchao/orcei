<script setup lang="ts">
import { computed } from 'vue'
import { MessageCircle, MoreVertical, History, Download, RefreshCcw, Mail, Pencil, Trash2 } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { ProposalDTO } from '../../../types'

const props = defineProps<{
  proposal: ProposalDTO
  statusVariant: 'default' | 'success' | 'warning' | 'error' | 'info'
  statusLabel: string
  isResending: boolean
}>()

defineEmits<{
  (e: 'open-info'): void
  (e: 'open-chat'): void
  (e: 'send-whatsapp'): void
  (e: 'open-history'): void
  (e: 'download-pdf'): void
  (e: 'resend-email'): void
  (e: 'edit'): void
  (e: 'delete'): void
}>()

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

const isExpiredState = computed(() =>
  props.proposal.status === 'expired' ||
  (props.proposal.status !== 'accepted' && new Date(props.proposal.expiresAt).getTime() <= Date.now())
)

const validityPercent = computed(() => {
  if (props.proposal.status === 'accepted') return 100
  const created = new Date(props.proposal.createdAt).getTime()
  const expires = new Date(props.proposal.expiresAt).getTime()
  if (!expires || expires <= created) return 0
  const remaining = expires - Date.now()
  const total = expires - created
  return Math.max(0, Math.min(100, (remaining / total) * 100))
})

const validityBarColor = computed(() =>
  props.proposal.status === 'accepted'
    ? 'bg-green-600'
    : isExpiredState.value
      ? 'bg-red-400'
      : 'bg-green-500'
)

function canShowChatButton(status: string) {
  return !['draft', 'accepted', 'bounced'].includes(status)
}

function canShowWhatsappButton(status: string) {
  return status !== 'draft'
}
</script>

<template>
  <div @click="$emit('open-info')" class="rounded-[0.75rem] border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-4 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-all">
    <!-- topo: ref + badge -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-bold text-gray-400">REF: {{ proposal.code }}</span>
      <BaseBadge :variant="statusVariant">{{ statusLabel }}</BaseBadge>
    </div>

    <!-- título: código + título do orçamento -->
    <h3 class="text-xl font-black text-gray-900 dark:text-gray-50 tracking-tight">{{ proposal.title || 'Sem título' }}</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ proposal.client.name }}</p>

    <!-- data / total -->
    <div class="flex items-center justify-between mt-4">
      <span class="text-xs text-gray-500 font-medium">{{ formatDate(proposal.createdAt) }}</span>
      <div class="text-right">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total</span>
        <span class="font-black text-gray-900 dark:text-gray-50">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
      </div>
    </div>

    <!-- barra de validade -->
    <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
      <div class="h-full rounded-full transition-all" :class="validityBarColor" :style="{ width: validityPercent + '%' }"></div>
    </div>

    <!-- rodapé: ações -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <div class="flex items-center gap-1">
        <button
          v-if="canShowChatButton(proposal.status)"
          @click.stop="$emit('open-chat')"
          class="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-[0.50rem] transition-all relative"
          title="Chat e Interações"
          aria-label="Abrir chat do orçamento"
        >
          <MessageCircle class="w-5 h-5" />
          <span
            v-if="proposal.unreadMessages > 0"
            class="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-[0.75rem] bg-red-500 text-[8px] font-black text-white ring-2 ring-white"
          >
            {{ proposal.unreadMessages }}
          </span>
        </button>
        <button
          v-if="proposal.client.phone && canShowWhatsappButton(proposal.status)"
          @click.stop="$emit('send-whatsapp')"
          class="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-[0.50rem] transition-all"
          title="Enviar via WhatsApp"
          aria-label="Enviar via WhatsApp"
        >
          <img :src="'/images/icons/whatsapp-svg.svg'" class="w-5 h-5" alt="WhatsApp" loading="lazy" />
        </button>
      </div>

      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            @click.stop
            class="p-2 text-gray-400 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-[0.75rem] transition-all"
            title="Mais ações"
            aria-label="Mais ações do orçamento"
          >
            <MoreVertical class="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent
            align="end"
            :side-offset="6"
            class="min-w-[220px] bg-white dark:bg-gray-900 rounded-[0.75rem] shadow-xl border border-gray-100 dark:border-gray-800 p-2 z-50"
          >
            <DropdownMenuItem
              @click="$emit('open-history')"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.50rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
            >
              <History class="w-4 h-4 text-blue-500" />
              Ver Histórico
            </DropdownMenuItem>
            <DropdownMenuItem
              @click="$emit('download-pdf')"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.50rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer outline-none transition-all"
            >
              <Download class="w-4 h-4 text-blue-500" />
              Baixar Orçamento
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="proposal.status !== 'draft' && proposal.status !== 'accepted'"
              :disabled="isResending"
              @click="$emit('resend-email')"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.50rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer outline-none transition-all disabled:opacity-50"
            >
              <RefreshCcw v-if="isResending" class="w-4 h-4 animate-spin text-indigo-500" />
              <Mail v-else class="w-4 h-4 text-indigo-500" />
              Reenviar E-mail
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="proposal.status !== 'accepted'"
              @click="$emit('edit')"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.50rem] text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer outline-none transition-all"
            >
              <Pencil class="w-4 h-4 text-amber-500" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="proposal.status !== 'accepted'"
              @click="$emit('delete')"
              class="flex items-center gap-3 px-4 py-3 rounded-[0.50rem] text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-300 cursor-pointer outline-none transition-all"
            >
              <Trash2 class="w-4 h-4 text-red-500" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </div>
</template>
