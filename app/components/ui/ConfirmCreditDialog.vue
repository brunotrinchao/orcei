<script setup lang="ts">
import BaseAlertDialog from './BaseAlertDialog.vue'

defineProps<{
  open: boolean
  title?: string
  description?: string
  cost?: number
}>()

const emit = defineEmits(['update:open', 'confirm', 'cancel'])
</script>

<template>
  <BaseAlertDialog
    :open="open"
    :title="title || 'Confirmar Consumo de Crédito'"
    :description="description"
    cancel-text="Cancelar"
    action-text="Confirmar e Executar"
    variant="primary"
    @update:open="emit('update:open', $event)"
    @confirm="emit('confirm')"
    @cancel="emit('cancel')"
  />
</template>
