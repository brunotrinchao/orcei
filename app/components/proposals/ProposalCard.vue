<script setup lang="ts">
import { computed } from 'vue'
import { MessageCircle, MoreVertical, History, Eye, RefreshCcw, Mail, Pencil, Trash2 } from 'lucide-vue-next'
import { DropdownMenuRoot, DropdownMenuTrigger, DropdownMenuPortal, DropdownMenuContent, DropdownMenuItem } from 'radix-vue'
import type { ProposalDTO } from '../../../types'

const props = defineProps<{
  proposal: ProposalDTO
  statusVariant: 'default' | 'success' | 'warning' | 'error' | 'info'
  statusLabel: string
  isResending: boolean
}>()

defineEmits<{
  (e: 'open-chat'): void
  (e: 'send-whatsapp'): void
  (e: 'open-history'): void
  (e: 'open-preview'): void
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
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
    <!-- topo: ref + badge -->
    <div class="flex items-center justify-between mb-2">
      <span class="text-xs font-bold text-gray-400">REF: {{ proposal.code }}</span>
      <BaseBadge :variant="statusVariant">{{ statusLabel }}</BaseBadge>
    </div>

    <!-- título: código + título do orçamento -->
    <h3 class="text-xl font-black text-gray-900 tracking-tight">{{ proposal.code }}</h3>
    <p class="text-sm text-gray-600 font-semibold mt-0.5">{{ proposal.title || 'Sem título' }}</p>
    <p class="text-sm text-gray-500 mt-0.5">{{ proposal.client.name }}</p>

    <!-- data / total -->
    <div class="flex items-center justify-between mt-4">
      <span class="text-xs text-gray-500 font-medium">{{ formatDate(proposal.createdAt) }}</span>
      <div class="text-right">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Total</span>
        <span class="font-black text-gray-900">R$ {{ proposal.totals.final.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) }}</span>
      </div>
    </div>

    <!-- barra de validade -->
    <div class="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-3">
      <div class="h-full rounded-full transition-all" :class="validityBarColor" :style="{ width: validityPercent + '%' }"></div>
    </div>

    <!-- rodapé: ações -->
    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <div class="flex items-center gap-1">
        <button
          @click="$emit('open-chat')"
          class="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all relative"
          title="Chat e Interações"
          aria-label="Abrir chat do orçamento"
        >
          <MessageCircle class="w-5 h-5" />
          <span
            v-if="proposal.unreadMessages > 0"
            class="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white ring-2 ring-white"
          >
            {{ proposal.unreadMessages }}
          </span>
        </button>
        <button
          v-if="proposal.client.phone"
          @click="$emit('send-whatsapp')"
          class="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
          title="Enviar via WhatsApp"
          aria-label="Enviar via WhatsApp"
        >
          <img :src="'/images/icons/whatsapp-svg.svg'" class="w-5 h-5" alt="WhatsApp" loading="lazy" />
        </button>
      </div>

      <DropdownMenuRoot>
        <DropdownMenuTrigger as-child>
          <button
            class="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
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
            class="min-w-[220px] bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50"
          >
            <DropdownMenuItem
              @click="$emit('open-history')"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
            >
              <History class="w-4 h-4" />
              Ver Histórico
            </DropdownMenuItem>
            <DropdownMenuItem
              @click="$emit('open-preview')"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
            >
              <Eye class="w-4 h-4" />
              Visualizar Orçamento
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="proposal.status !== 'draft' && proposal.status !== 'accepted'"
              :disabled="isResending"
              @click="$emit('resend-email')"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all disabled:opacity-50"
            >
              <RefreshCcw v-if="isResending" class="w-4 h-4 animate-spin" />
              <Mail v-else class="w-4 h-4" />
              Reenviar E-mail
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="proposal.status !== 'accepted'"
              @click="$emit('edit')"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 cursor-pointer outline-none transition-all"
            >
              <Pencil class="w-4 h-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              v-if="proposal.status !== 'accepted'"
              @click="$emit('delete')"
              class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 cursor-pointer outline-none transition-all"
            >
              <Trash2 class="w-4 h-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenuRoot>
    </div>
  </div>
</template>
