import { computed } from 'vue'
import { Phone, Plus, MessageSquare, Trash2, Instagram, Youtube, Facebook, Twitter } from 'lucide-vue-next'

export function useSettingsContact(
  props: { contact: { phones: { number: string; isWhatsapp: boolean }[]; social: { instagram: string; youtube: string; facebook: string; twitter: string } } },
  emit: (e: 'update:contact', val: any) => void
) {
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

  return {
    localContact,
    addPhone,
    removePhone,
    Phone,
    Plus,
    MessageSquare,
    Trash2,
    Instagram,
    Youtube,
    Facebook,
    Twitter
  }
}
