import { User, Mail, Phone, FileText, MapPin, CheckCircle2 } from 'lucide-vue-next'

export interface WizardClientData {
  name: string
  email: string
  phone: string
  isWhatsapp: boolean
  taxId: string
  city: string
  state: string
}

export function useWizardClientStep() {
  return {
    User,
    Mail,
    Phone,
    FileText,
    MapPin,
    CheckCircle2
  }
}
