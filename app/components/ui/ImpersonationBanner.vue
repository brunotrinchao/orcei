<script setup lang="ts">
import { ShieldAlert, ArrowLeftRight } from 'lucide-vue-next'

const { session, fetch: refreshSession } = useUserSession()
const { notify } = useAlerts()
const isStopping = ref(false)

const impersonatedBy = computed(() => session.value?.impersonatedBy || null)

async function stopImpersonating() {
  if (isStopping.value) return
  isStopping.value = true
  try {
    await $fetch('/api/admin/impersonate/stop', { method: 'POST' })
    await refreshSession()
    await refreshNuxtData('profile') // limpa cache do perfil personificado
    notify('Sucesso', 'Você voltou ao seu painel de administrador.')
    await navigateTo('/admin/users')
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro ao voltar para o administrador.')
  } finally {
    isStopping.value = false
  }
}
</script>

<template>
  <div
    v-if="impersonatedBy"
    class="fixed top-0 inset-x-0 z-[9000] flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white shadow-md"
    role="banner"
  >
    <p class="text-[11px] sm:text-xs font-bold flex items-center gap-1.5 truncate">
      <ShieldAlert class="w-3.5 h-3.5 shrink-0" />
      Modo administrador — você está visualizando como
      <span class="font-black truncate">{{ impersonatedBy?.id ? 'usuário personificado' : 'usuário' }}</span>
    </p>
    <button
      type="button"
      @click="stopImpersonating"
      :disabled="isStopping"
      class="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-[.5rem] bg-white/20 hover:bg-white/30 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-60"
      aria-label="Voltar para admin"
    >
      <ArrowLeftRight v-if="!isStopping" class="w-3.5 h-3.5" />
      <span v-else class="w-3.5 h-3.5 animate-spin border-2 border-white/40 border-t-white rounded-full" />
      Voltar para Admin
    </button>
  </div>
</template>