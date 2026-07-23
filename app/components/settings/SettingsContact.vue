<script setup lang="ts">
import { computed } from 'vue'
import { Phone, Plus, MessageSquare, Trash2, Instagram, Youtube, Facebook, Twitter } from 'lucide-vue-next'

const props = defineProps<{
  contact: {
    phones: { number: string; isWhatsapp: boolean }[]
    social: { instagram: string; youtube: string; facebook: string; twitter: string }
  }
}>()

const emit = defineEmits<{
  (e: 'update:contact', val: any): void
}>()

const localContact = computed({
  get: () => props.contact,
  set: (val) => emit('update:contact', val)
})

function addPhone() {
  localContact.value.phones.push({ number: '', isWhatsapp: false })
}

function removePhone(index: number) {
  if (localContact.value.phones.length > 1) {
    localContact.value.phones.splice(index, 1)
  }
}
</script>

<template>
  <BaseSectionCard id="contato" data-tour="config-contato" title="Contato e Redes Sociais" :icon="Phone" icon-bg-class="bg-blue-50 dark:bg-blue-950/50" icon-color-class="text-blue-600 dark:text-blue-400">

    <div class="space-y-8">
      <div class="space-y-4">
        <div class="flex justify-between items-center px-1">
          <label class="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">Telefones</label>
          <BaseButton
            type="button"
            variant="ghost"
            size="sm"
            @click="addPhone"
            class="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus class="w-3 h-3 mr-1" /> Adicionar
          </BaseButton>
        </div>
        <div v-for="(phone, idx) in localContact.phones" :key="idx" class="flex flex-col sm:flex-row gap-4 p-6 bg-gray-50/50 dark:bg-gray-950/50 rounded-3xl border border-gray-100 dark:border-gray-800">
          <div class="flex-1">
            <BaseInput v-model="phone.number" label="Número" placeholder="(00) 00000-0000" mask="phone" />
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <div class="flex items-center gap-2">
              <BaseCheckbox v-model="phone.isWhatsapp" :id="'wa-'+idx" />
              <label :for="'wa-'+idx" class="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest cursor-pointer flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                <img :src="'/images/icons/whatsapp-svg.svg'" class="w-3 h-3" alt="WhatsApp" loading="lazy"/> WhatsApp
              </label>
            </div>
            <BaseButton
              v-if="localContact.phones.length > 1"
              type="button"
              variant="ghost"
              size="icon-sm"
              @click="removePhone(idx)"
              class="text-red-400 hover:text-red-600"
              title="Remover telefone"
              aria-label="Remover telefone"
            >
              <Trash2 class="w-4 h-4" />
            </BaseButton>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-800" v-if="localContact.social">
        <BaseInput
          v-model="localContact.social.instagram"
          label="Instagram"
          placeholder="@seuusuario"
        >
          <template #icon>
            <Instagram class="w-4 h-4 text-pink-500" />
          </template>
        </BaseInput>

        <BaseInput
          v-model="localContact.social.youtube"
          label="YouTube"
          placeholder="Canal"
        >
          <template #icon>
            <Youtube class="w-4 h-4 text-red-500" />
          </template>
        </BaseInput>

        <BaseInput
          v-model="localContact.social.facebook"
          label="Facebook"
          placeholder="@suapagina"
        >
          <template #icon>
            <Facebook class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </template>
        </BaseInput>

        <BaseInput
          v-model="localContact.social.twitter"
          label="Twitter (X)"
          placeholder="@seuusuario"
        >
          <template #icon>
            <Twitter class="w-4 h-4 text-gray-800 dark:text-gray-200" />
          </template>
        </BaseInput>
      </div>
    </div>
  </BaseSectionCard>
</template>
