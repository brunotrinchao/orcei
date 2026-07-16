<script setup lang="ts">
import { Ticket, Pencil, Trash2, RotateCcw } from 'lucide-vue-next'

defineProps<{
  coupon: any
  audienceLabels: Record<string, string>
  formatDate: (ts: number | null) => string
}>()

defineEmits<{
  (e: 'edit'): void
  (e: 'deactivate'): void
  (e: 'reactivate'): void
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Ticket class="w-5 h-5 text-gray-400" />
        </div>
        <span class="font-black text-gray-900 tracking-wide">{{ coupon.code }}</span>
      </div>
      <BaseBadge :variant="coupon.active ? 'success' : 'error'">{{ coupon.active ? 'Ativo' : 'Inativo' }}</BaseBadge>
    </div>

    <div class="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100 text-xs">
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Créditos</span>
        <span class="font-black text-gray-900">{{ coupon.credits }}</span>
      </div>
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Público</span>
        <BaseBadge variant="info">{{ audienceLabels[coupon.audience] || 'Todos' }}</BaseBadge>
      </div>
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Usos</span>
        <span class="font-bold text-gray-500">{{ coupon.timesRedeemed }} / {{ coupon.maxRedemptions ?? '∞' }}</span>
      </div>
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Expira em</span>
        <span class="font-bold text-gray-500">{{ formatDate(coupon.expiresAt) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
      <button @click="$emit('edit')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Editar" aria-label="Editar cupom">
        <Pencil class="w-5 h-5" />
      </button>
      <button v-if="coupon.active" @click="$emit('deactivate')" class="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Excluir (desativa)" aria-label="Desativar cupom">
        <Trash2 class="w-5 h-5" />
      </button>
      <button v-else @click="$emit('reactivate')" class="p-2 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Reativar" aria-label="Reativar cupom">
        <RotateCcw class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
