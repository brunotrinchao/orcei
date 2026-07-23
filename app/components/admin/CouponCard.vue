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
  <div class="rounded-2xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
          <Ticket class="w-5 h-5 text-gray-400" />
        </div>
        <span class="font-black text-gray-900 dark:text-white tracking-wide">{{ coupon.code }}</span>
      </div>
      <BaseBadge :variant="coupon.active ? 'success' : 'error'">{{ coupon.active ? 'Ativo' : 'Inativo' }}</BaseBadge>
    </div>

    <div class="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Créditos</span>
        <span class="font-black text-gray-900 dark:text-white">{{ coupon.credits }}</span>
      </div>
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Público</span>
        <BaseBadge variant="info">{{ audienceLabels[coupon.audience] || 'Todos' }}</BaseBadge>
      </div>
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Usos</span>
        <span class="font-bold text-gray-500 dark:text-gray-400">{{ coupon.timesRedeemed }} / {{ coupon.maxRedemptions ?? '∞' }}</span>
      </div>
      <div>
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Expira em</span>
        <span class="font-bold text-gray-500 dark:text-gray-400">{{ formatDate(coupon.expiresAt) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <BaseButton variant="ghost" size="icon-sm" @click="$emit('edit')" class="text-blue-500 hover:text-blue-600" aria-label="Editar cupom" title="Editar">
        <Pencil class="w-4 h-4" />
      </BaseButton>
      <BaseButton v-if="coupon.active" variant="ghost" size="icon-sm" @click="$emit('deactivate')" class="text-red-500 hover:text-red-600" aria-label="Desativar cupom" title="Excluir (desativa)">
        <Trash2 class="w-4 h-4" />
      </BaseButton>
      <BaseButton v-else variant="ghost" size="icon-sm" @click="$emit('reactivate')" class="text-emerald-500 hover:text-emerald-600" aria-label="Reativar cupom" title="Reativar">
        <RotateCcw class="w-4 h-4" />
      </BaseButton>
    </div>
  </div>
</template>
