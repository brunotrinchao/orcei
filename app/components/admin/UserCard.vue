<script setup lang="ts">
import { User, CreditCard, LogIn, Shield } from 'lucide-vue-next'

defineProps<{
  user: any
  isImpersonating: boolean
  formatDate: (date: string) => string
}>()

defineEmits<{
  (e: 'adjust-credits'): void
  (e: 'impersonate'): void
}>()
</script>

<template>
  <div class="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
        <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover" loading="lazy">
        <User v-else class="w-5 h-5 text-gray-400" />
      </div>
      <div class="flex flex-col min-w-0">
        <span class="font-black text-gray-900 truncate">{{ user.name }}</span>
        <span class="text-[10px] font-bold text-gray-400 uppercase truncate">{{ user.email }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <BaseBadge :variant="user.subscriptionPlan === 'premium' ? 'success' : user.subscriptionPlan === 'starter' ? 'info' : 'default'">
        {{ user.subscriptionPlan?.toUpperCase() || 'FREE' }}
      </BaseBadge>
      <div class="text-right">
        <span class="font-black text-gray-900 block">{{ user.creditsBalance }} créditos</span>
        <span class="text-[10px] font-bold text-gray-400">{{ formatDate(user.createdAt) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
      <button @click="$emit('adjust-credits')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Ajustar Créditos" aria-label="Ajustar créditos">
        <CreditCard class="w-5 h-5" />
      </button>
      <button v-if="user.role !== 'admin'" :disabled="isImpersonating" @click="$emit('impersonate')" class="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all disabled:opacity-50" title="Personificar Usuário" aria-label="Personificar usuário">
        <LogIn class="w-5 h-5" />
      </button>
      <button v-if="user.role === 'admin'" class="p-2 text-red-500 bg-red-50 rounded-xl" title="Administrador" aria-label="Administrador">
        <Shield class="w-5 h-5" />
      </button>
    </div>
  </div>
</template>
