<script setup lang="ts">
import { computed } from "vue";
import {
  FileText,
  DollarSign,
  Calendar,
  Eye,
  MessageSquare,
  ExternalLink,
  Copy,
  Pencil,
  Mail,
  Phone,
  User,
  Package,
  Sparkles,
  CreditCard,
  Lock,
  CheckCircle2,
  AlertCircle,
} from "lucide-vue-next";
import type { ProposalDTO } from "../../../types";

const props = defineProps<{
  open: boolean;
  proposal: ProposalDTO | null;
}>();

const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
  (e: "edit", proposal: ProposalDTO): void;
}>();

const { notify } = useAlerts();

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "error" | "info";
  }
> = {
  draft: { label: "Rascunho", variant: "default" },
  created: { label: "Criado", variant: "info" },
  sent: { label: "Enviado", variant: "info" },
  viewed: { label: "Visualizado", variant: "warning" },
  accepted: { label: "Aceito", variant: "success" },
  rejected: { label: "Recusado", variant: "error" },
  expired: { label: "Expirado", variant: "error" },
  bounced: { label: "Erro Envio", variant: "error" },
};

const currentStatus = computed(() => {
  if (!props.proposal?.status) return statusMap.draft;
  return statusMap[props.proposal.status] || statusMap.draft;
});

// O link só pode estar habilitado se NÃO for rascunho nem recusado (já enviado ao cliente)
const canOpenPublicLink = computed(() => {
  if (!props.proposal?.status) return false;
  const st = props.proposal.status;
  return st !== "draft" && st !== "rejected";
});

const publicUrl = computed(() => {
  if (!props.proposal?.slug) return "";
  const config = useRuntimeConfig();
  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const baseOrigin =
    typeof window !== "undefined"
      ? isLocal
        ? window.location.origin
        : config.public.publicProposalUrl || window.location.origin
      : "";
  const tokenPart = (props.proposal as any).token
    ? `?t=${(props.proposal as any).token}`
    : "";
  return `${baseOrigin}/p/${props.proposal.slug}${tokenPart}`;
});

function copyPublicLink() {
  if (!canOpenPublicLink.value) {
    notify(
      "Aviso",
      "O link público só fica disponível após a proposta ser enviada ao cliente.",
    );
    return;
  }
  if (!publicUrl.value) return;
  navigator.clipboard.writeText(publicUrl.value);
  notify("Sucesso", "Link público copiado para a área de transferência!");
}

function openPublicLink() {
  if (!canOpenPublicLink.value) {
    notify(
      "Aviso",
      "O link público só fica disponível após a proposta ser enviada ao cliente.",
    );
    return;
  }
  if (!publicUrl.value) return;
  window.open(publicUrl.value, "_blank");
}

function openWhatsApp() {
  if (!props.proposal?.client?.phone) return;
  const cleanPhone = props.proposal.client.phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Olá ${props.proposal.client.name || ""}, segue o link do seu orçamento "${props.proposal.title}":\n${publicUrl.value}`,
  );
  window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
}

function formatCurrency(val?: number) {
  return (val ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(dateStr?: string | Date) {
  if (!dateStr) return "Não informada";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Não informada";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPhone(phone?: string) {
  if (!phone) return "Não informado";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

const calculatedSubtotal = computed(() => {
  if (!props.proposal) return 0;
  if (
    props.proposal.totals?.subtotal !== undefined &&
    props.proposal.totals.subtotal > 0
  ) {
    return props.proposal.totals.subtotal;
  }
  if (props.proposal.items && props.proposal.items.length > 0) {
    return props.proposal.items.reduce(
      (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
      0,
    );
  }
  return 0;
});

const calculatedAdditional = computed(() => {
  if (!props.proposal) return 0;
  return props.proposal.totals?.additional || 0;
});

const calculatedDiscount = computed(() => {
  if (!props.proposal) return 0;
  return props.proposal.totals?.discount ?? props.proposal.discountAmount ?? 0;
});

const calculatedTotal = computed(() => {
  if (!props.proposal) return 0;
  if (
    props.proposal.totals?.final !== undefined &&
    props.proposal.totals.final > 0
  ) {
    return props.proposal.totals.final;
  }
  if (
    props.proposal.totalAmount !== undefined &&
    props.proposal.totalAmount > 0
  ) {
    return props.proposal.totalAmount;
  }
  return (
    calculatedSubtotal.value +
    calculatedAdditional.value -
    calculatedDiscount.value
  );
});

const expirationDate = computed(() => {
  if (!props.proposal) return null;
  return props.proposal.expiresAt || props.proposal.expirationDate || null;
});

const paymentTermsText = computed(() => {
  if (!props.proposal) return "Condição padrão";
  const cfg = (props.proposal as any).paymentConfig || {};
  const method = cfg.method || "cash";
  if (method === "cash") {
    const desc = cfg.cashDiscount
      ? ` ${cfg.cashDiscount}% de desconto à vista`
      : "";
    return `${desc}`;
  }
  if (method === "installments") {
    const count = cfg.installments || 1;
    const partVal = calculatedTotal.value / count;
    return `Parcelado em ${count}x de ${formatCurrency(partVal)}`;
  }
  if (method === "hybrid") {
    const count = cfg.installments || 1;
    return `Entrada + ${count}x parcelado`;
  }
  return "Conforme orçamento";
});
</script>

<template>
  <BaseDialog
    :open="open"
    @update:open="(val) => emit('update:open', val)"
    :title="'Orçamento'"
    size="xl"
  >
    <div v-if="proposal" class="space-y-6 py-2">
      <!-- ─── HEADER COMERCIAL ─────────────────────────────────────────── -->
      <div
        class="pb-6 border-dashed border-b border-gray-200 dark:border-gray-800 text-white space-y-4 relative overflow-hidden"
      >
        <div
          class="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-3 flex-wrap">
              <BaseBadge variant="ia" v-if="proposal.aiAssisted">
                <Sparkles
                  class="w-3 h-3 text-white dark:text-violet-400 mr-1"
                />
                IA
              </BaseBadge>
              <BaseBadge :variant="currentStatus.variant">
                {{ currentStatus.label }}
              </BaseBadge>
            </div>
            <h2
              class="text-xl md:text-2xl font-black dark:text-white text-gray-800 tracking-tight pt-1"
            >
              {{ proposal.title }}
            </h2>
          </div>

          <!-- Ações Rápidas em Destaque -->
          <div class="flex items-center gap-2 flex-wrap shrink-0">
            <div class="flex flex-row justify-between gap-2 sm:w-auto w-full">
              <BaseButton
                type="button"
                @click="copyPublicLink"
                :disabled="!canOpenPublicLink"
                variante="ghost"
                size="sm"
                :class="[
                  'w-full sm:w-auto inline-flex items-center px-3 py-2 rounded-[0.50rem] text-xs font-bold transition-all border',
                  canOpenPublicLink
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer'
                    : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-60',
                ]"
                :title="
                  canOpenPublicLink
                    ? 'Copiar Link Público'
                    : 'Disponível apenas após o envio da proposta'
                "
              >
                <Copy class="w-4 h-4 mr-2" /> Copiar Link
              </BaseButton>
              <BaseButton
                type="button"
                @click="openPublicLink"
                :disabled="!canOpenPublicLink"
                variante="ghost"
                size="sm"
                :class="[
                  'w-full sm:w-auto inline-flex items-center px-3 py-2 rounded-[0.50rem] text-xs font-bold transition-all border',
                  canOpenPublicLink
                    ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer'
                    : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-60',
                ]"
                :title="
                  canOpenPublicLink
                    ? 'Abrir Visão do Cliente'
                    : 'Disponível apenas após o envio da proposta'
                "
              >
                <ExternalLink class="w-4 h-4 mr-1.5" /> Abrir Link
              </BaseButton>
            </div>
            <BaseButton
              type="button"
              v-if="proposal.client?.phone"
              @click.prevent="openWhatsApp"
              variant="whatsapp"
              size="sm"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[0.50rem] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <img
                src="/images/icons/whatsapp-svg.svg"
                class="w-4 h-4"
                alt="WhatsApp"
              />
              WhatsApp
            </BaseButton>
            <!-- <button 
              type="button" 
              @click="copyPublicLink" 
              :disabled="!canOpenPublicLink"
              :class="[
                'w-full sm:w-auto inline-flex items-center px-3 py-2 rounded-[0.50rem] text-xs font-bold transition-all border',
                canOpenPublicLink 
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer' 
                  : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-60'
              ]"
              :title="canOpenPublicLink ? 'Copiar Link Público' : 'Disponível apenas após o envio da proposta'"
            >
              <Copy class="w-4 h-4 mr-1.5" /> Copiar Link
            </button> 

            <button 
              type="button" 
              @click="openPublicLink" 
              :disabled="!canOpenPublicLink"
              :class="[
                'w-full sm:w-auto inline-flex items-center px-3 py-2 rounded-[0.50rem] text-xs font-bold transition-all border',
                canOpenPublicLink 
                  ? 'bg-white/10 hover:bg-white/20 text-white border-white/20 cursor-pointer' 
                  : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed opacity-60'
              ]"
              :title="canOpenPublicLink ? 'Abrir Visão do Cliente' : 'Disponível apenas após o envio da proposta'"
            >
              <Lock v-if="!canOpenPublicLink" class="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              <ExternalLink v-else class="w-4 h-4 mr-1.5" /> Ver Link
            </button>

            <a 
              v-if="proposal.client?.phone" 
              @click.prevent="openWhatsApp"
              href="#"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-[0.50rem] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
            >
              <img src="/images/icons/whatsapp-svg.svg" class="w-4 h-4" alt="WhatsApp" /> WhatsApp
            </a>-->
          </div>
        </div>
      </div>

      <!-- ─── CARDS DE MÉTRICAS COMERCIAIS ────────────────────────────── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Valor Total -->
        <div
          class="p-4 rounded-[0.75rem] bg-green-50 dark:bg-green-900/60 border border-green-200 dark:border-green-800 space-y-1"
        >
          <div
            class="flex items-center justify-between text-green-400 dark:text-green-500"
          >
            <span class="text-[10px] font-black uppercase tracking-wider"
              >Valor Total</span
            >
            <DollarSign class="w-4 h-4 text-emerald-500" />
          </div>
          <p
            class="text-xl font-black text-green-900 dark:text-green-100 truncate"
          >
            {{ formatCurrency(calculatedTotal) }}
          </p>
          <p
            v-if="calculatedDiscount"
            class="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate"
          >
            Desc: {{ formatCurrency(calculatedDiscount) }}
          </p>
          <p v-else class="text-[10px] text-green-400 font-medium truncate">
            Sem desconto aplicado
          </p>
        </div>

        <!-- Validade -->
        <div
          class="p-4 rounded-[0.75rem] bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 space-y-1"
        >
          <div
            class="flex items-center justify-between text-gray-400 dark:text-gray-500"
          >
            <span class="text-[10px] font-black uppercase tracking-wider"
              >Criado em</span
            >
            <Calendar class="w-4 h-4 text-blue-500" />
          </div>
          <p
            class="text-sm font-black text-gray-900 dark:text-gray-100 truncate"
          >
            {{ formatDate(proposal.createdAt) }}
          </p>
          <p
            class="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate"
          >
            Validade:
            {{ expirationDate ? formatDate(expirationDate) : "Indefinida" }}
          </p>
        </div>

        <!-- Engajamento / Visualizações -->
        <div
          class="p-4 rounded-[0.75rem] bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-1"
        >
          <div
            class="flex items-center justify-between text-amber-600 dark:text-amber-400"
          >
            <span class="text-[10px] font-black uppercase tracking-wider"
              >Visualizações</span
            >
            <Eye class="w-4 h-4 text-amber-500" />
          </div>
          <p class="text-xl font-black text-amber-900 dark:text-amber-200">
            {{ (proposal as any).viewsCount || 0 }}x
          </p>
          <p
            class="text-[10px] text-amber-700 dark:text-amber-300 font-bold truncate"
          >
            {{
              (proposal as any).lastViewedAt
                ? `Última: ${formatDate((proposal as any).lastViewedAt)}`
                : "Nunca visualizado"
            }}
          </p>
        </div>

        <!-- Mensagens Chat -->
        <div
          class="p-4 rounded-[0.75rem] bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40 space-y-1"
        >
          <div
            class="flex items-center justify-between text-indigo-600 dark:text-indigo-400"
          >
            <span class="text-[10px] font-black uppercase tracking-wider"
              >Mensagens Chat</span
            >
            <MessageSquare class="w-4 h-4 text-indigo-500" />
          </div>
          <p class="text-xl font-black text-indigo-900 dark:text-indigo-200">
            {{ (proposal as any).unreadMessages || 0 }}
            <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400"
              >não lidas</span
            >
          </p>
          <p
            class="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium truncate"
          >
            {{
              (proposal as any).hasMessages
                ? "Chat ativo pelo cliente"
                : "Nenhuma mensagem"
            }}
          </p>
        </div>
      </div>

      <!-- ─── RESUMO FINANCEIRO & PAGAMENTO (NOVO) ────────────────────────── -->
      <div
        class="p-5 rounded-[0.75rem] bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-gray-900 dark:to-indigo-950/20 border border-gray-200 dark:border-gray-800 space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3"
        >
          <span
            class="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-2"
          >
            <CreditCard class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Financeiro
          </span>
          <BaseBadge variant="price">
            {{ paymentTermsText }}
          </BaseBadge>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div
            class="space-y-1 p-3 rounded-[0.50rem] bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700"
          >
            <span
              class="text-[10px] font-black text-gray-400 uppercase tracking-wider block"
              >Subtotal</span
            >
            <span class="font-black text-gray-900 dark:text-gray-100 text-sm">{{
              formatCurrency(calculatedSubtotal)
            }}</span>
          </div>

          <div
            class="space-y-1 p-3 rounded-[0.50rem] bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700"
          >
            <span
              class="text-[10px] font-black text-gray-400 uppercase tracking-wider block"
              >Desconto</span
            >
            <span
              class="font-black text-emerald-600 dark:text-emerald-400 text-sm"
            >
              {{
                calculatedDiscount > 0
                  ? `- ${formatCurrency(calculatedDiscount)}`
                  : "R$ 0,00"
              }}
            </span>
          </div>

          <div
            class="space-y-1 p-3 rounded-[0.50rem] bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700"
          >
            <span
              class="text-[10px] font-black text-gray-400 uppercase tracking-wider block"
              >Acréscimos / Taxas</span
            >
            <span class="font-black text-amber-600 dark:text-amber-400 text-sm">
              {{
                calculatedAdditional > 0
                  ? `+ ${formatCurrency(calculatedAdditional)}`
                  : "R$ 0,00"
              }}
            </span>
          </div>

          <div
            class="space-y-1 p-3 rounded-[0.50rem] bg-indigo-600 text-white shadow-md"
          >
            <span
              class="text-[10px] font-black text-indigo-200 uppercase tracking-wider block"
              >Valor Líquido</span
            >
            <span class="font-black text-white text-sm">{{
              formatCurrency(calculatedTotal)
            }}</span>
          </div>
        </div>
      </div>

      <!-- ─── DADOS DO CLIENTE VINCULADO ───────────────────────────────── -->
      <div
        class="p-5 rounded-[0.75rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-3"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2"
        >
          <span
            class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2"
          >
            <User class="w-4 h-4 text-blue-500" /> Cliente Solicitante
          </span>
          <span
            v-if="proposal.client?.taxId"
            class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded"
          >
            {{ proposal.client.taxId }}
          </span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span
              class="text-[10px] font-black text-gray-400 uppercase tracking-wider block"
              >Nome / Razão Social</span
            >
            <span class="font-black text-gray-900 dark:text-gray-100">{{
              proposal.client?.name || "Cliente não informado"
            }}</span>
          </div>

          <div>
            <span
              class="text-[10px] font-black text-gray-400 uppercase tracking-wider block"
              >E-mail</span
            >
            <a
              v-if="proposal.client?.email"
              :href="`mailto:${proposal.client.email}`"
              class="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Mail class="w-3.5 h-3.5" /> {{ proposal.client.email }}
            </a>
            <span v-else class="text-gray-400 italic text-xs"
              >Não informado</span
            >
          </div>

          <div>
            <span
              class="text-[10px] font-black text-gray-400 uppercase tracking-wider block"
              >Telefone / WhatsApp</span
            >
            <a
              v-if="proposal.client?.phone"
              @click.prevent="openWhatsApp"
              href="#"
              class="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Phone class="w-3.5 h-3.5" />
              {{ formatPhone(proposal.client.phone) }}
            </a>
            <span v-else class="text-gray-400 italic text-xs"
              >Não informado</span
            >
          </div>
        </div>
      </div>

      <!-- ─── ESCOPO DE ITENS E SERVIÇOS INCLUÍDOS ──────────────────────── -->
      <div
        class="p-5 rounded-[0.75rem] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3"
        >
          <span
            class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2"
          >
            <Package class="w-4 h-4 text-blue-500" /> Itens e Serviços do Escopo
            ({{ proposal.items?.length || 0 }})
          </span>
          <span class="text-xs font-black text-gray-900 dark:text-white">
            Subtotal: {{ formatCurrency(calculatedSubtotal) }}
          </span>
        </div>

        <div
          v-if="proposal.items && proposal.items.length > 0"
          class="space-y-3"
        >
          <div
            v-for="(item, idx) in proposal.items"
            :key="idx"
            class="flex items-center justify-between gap-4 p-3.5 rounded-[0.50rem] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all"
          >
            <div class="flex items-center gap-4 min-w-0">
              <div
                class="w-12 h-12 rounded-[0.50rem] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden flex-shrink-0 flex items-center justify-center"
              >
                <BaseImage
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.name"
                  container-class="w-full h-full"
                  img-class="w-full h-full object-cover"
                />
                <Package v-else class="w-6 h-6 text-gray-400" />
              </div>
              <div class="min-w-0">
                <p
                  class="font-black text-gray-900 dark:text-gray-100 text-sm truncate"
                >
                  {{ item.name }}
                </p>
                <p
                  class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5"
                >
                  {{ item.description || "Sem descrição" }}
                </p>
              </div>
            </div>

            <div class="text-right shrink-0">
              <span
                class="font-black text-gray-900 dark:text-gray-100 text-sm block"
              >
                {{ formatCurrency((item.price || 0) * (item.quantity || 1)) }}
              </span>
              <span
                class="text-[10px] font-bold text-gray-400 uppercase tracking-wider"
              >
                {{ item.quantity || 1 }}x {{ formatCurrency(item.price) }} /
                {{ item.unit || "un" }}
              </span>
            </div>
          </div>
        </div>
        <div
          v-else
          class="text-center py-6 text-gray-400 text-xs font-bold uppercase tracking-wider"
        >
          Nenhum item adicionado a este orçamento.
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end w-full">
        <BaseButton type="button" @click="emit('edit', proposal)">
          <Pencil class="w-4 h-4 mr-2" />
          Editar Proposta
        </BaseButton>
      </div>
    </template>
  </BaseDialog>
</template>
