<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <BaseAlertDialog
    :open="open"
    title="Bem-vindo(a) ao Orcei!"
    description="Que tal um tour rápido pelas principais funções desta tela? Em menos de 1 minuto mostramos onde ficam os botões e recursos mais usados, pra você não perder tempo explorando sozinho(a). Pode reabrir depois pelo botão de ajuda (?)."
    cancel-text="Agora não"
    action-text="Iniciar tour"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  />
</template>
