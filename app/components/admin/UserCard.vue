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
  (e: 'view-details'): void
}>()
</script>

<template>
  <div
    class="rounded-[.5rem] border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm p-4"
    :class="user.role !== 'admin' ? 'cursor-pointer' : ''"
    @click="user.role !== 'admin' ? $emit('view-details') : null"
  >
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-[.5rem] bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0">
        <img v-if="user.avatar" :src="user.avatar" class="w-full h-full object-cover" loading="lazy">
        <User v-else class="w-5 h-5 text-gray-400" />
      </div>
      <div class="flex flex-col min-w-0">
        <span class="font-black text-gray-900 dark:text-white truncate">{{ user.name }}</span>
        <span class="text-[10px] font-bold text-gray-400 uppercase truncate">{{ user.email }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <BaseBadge :variant="user.subscriptionPlan === 'premium' ? 'success' : user.subscriptionPlan === 'starter' ? 'info' : 'default'">
        {{ user.subscriptionPlan?.toUpperCase() || 'FREE' }}
      </BaseBadge>
      <div class="text-right">
        <span class="font-black text-gray-900 dark:text-white block">{{ user.creditsBalance }} créditos</span>
        <span class="text-[10px] font-bold text-gray-400">{{ formatDate(user.createdAt) }}</span>
      </div>
    </div>

    <div class="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <BaseButton variant="ghost" size="icon-sm" @click.stop="$emit('adjust-credits')" class="text-blue-500 hover:text-blue-600" aria-label="Ajustar créditos" title="Ajustar Créditos">
        <CreditCard class="w-4 h-4" />
      </BaseButton>
      <BaseButton v-if="user.role !== 'admin'" variant="ghost" size="icon-sm" :disabled="isImpersonating" @click.stop="$emit('impersonate')" class="text-amber-500 hover:text-amber-600" aria-label="Personificar usuário" title="Personificar Usuário">
        <LogIn class="w-4 h-4" />
      </BaseButton>
      <BaseButton v-if="user.role === 'admin'" variant="ghost" size="icon-sm" @click.stop class="text-red-500" aria-label="Administrador" title="Administrador">
        <Shield class="w-4 h-4" />
      </BaseButton>
    </div>
  </div>
</template>
