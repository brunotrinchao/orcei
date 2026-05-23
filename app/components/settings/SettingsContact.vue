<script setup lang="ts">
import { computed } from 'vue'
import { Phone, Plus, MessageSquare, Trash2, Instagram, Youtube } from 'lucide-vue-next'

const props = defineProps<{
  contact: {
    phones: { number: string; isWhatsapp: boolean }[]
    social: { instagram: string; youtube: string }
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
  <section id="contato" class="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm scroll-mt-8">
    <div class="flex items-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
        <Phone class="w-5 h-5 text-blue-600" />
      </div>
      <h2 class="text-xl font-black text-gray-900 uppercase tracking-tight">Contato e Redes Sociais</h2>
    </div>

    <div class="space-y-8">
      <div class="space-y-4">
        <div class="flex justify-between items-center px-1">
          <label class="text-xs font-black text-gray-600 uppercase tracking-widest">Telefones</label>
          <button
            type="button"
            @click="addPhone"
            class="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:text-blue-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus class="w-3 h-3" /> Adicionar
          </button>
        </div>
        <div v-for="(phone, idx) in localContact.phones" :key="idx" class="flex flex-col sm:flex-row gap-4 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
          <div class="flex-1">
            <BaseInput v-model="phone.number" label="Número" placeholder="(00) 00000-0000" mask="phone" />
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <div class="flex items-center gap-2">
              <BaseCheckbox v-model="phone.isWhatsapp" :id="'wa-'+idx" />
              <label :for="'wa-'+idx" class="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer flex items-center gap-1.5 hover:text-gray-900 transition-colors">
                <MessageSquare class="w-3 h-3 text-green-500" /> WhatsApp
              </label>
            </div>
            <button
              v-if="localContact.phones.length > 1"
              type="button"
              @click="removePhone(idx)"
              class="p-2 text-red-400 hover:text-red-600 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl"
              title="Remover telefone"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100" v-if="localContact.social">
        <div class="space-y-3">
          <label for="social-instagram" class="block text-xs font-black text-gray-600 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Instagram class="w-3.5 h-3.5 text-pink-500" /> Instagram
          </label>
          <input
            id="social-instagram"
            v-model="localContact.social.instagram"
            type="text"
            placeholder="@seuusuario"
            class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
        </div>
        <div class="space-y-3">
          <label for="social-youtube" class="block text-xs font-black text-gray-600 uppercase tracking-widest ml-1 flex items-center gap-2">
            <Youtube class="w-3.5 h-3.5 text-red-500" /> YouTube
          </label>
          <input
            id="social-youtube"
            v-model="localContact.social.youtube"
            type="text"
            placeholder="Canal"
            class="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-bold text-gray-800 focus-visible:ring-2 focus-visible:ring-blue-600"
          >
        </div>
      </div>
    </div>
  </section>
</template>
