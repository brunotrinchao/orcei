<script setup lang="ts">
import {
  CheckCircle2,
  Building2,
  Phone,
  Palette,
  ClipboardCheck,
  AlertTriangle,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
} from "lucide-vue-next";
import type { ProfileDTO } from "../../../types";
import SettingsCompany from "../settings/SettingsCompany.vue";
import SettingsAddress from "../settings/SettingsAddress.vue";
import SettingsContact from "../settings/SettingsContact.vue";
import SettingsVisual from "../settings/SettingsVisual.vue";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const { notify } = useAlerts();
const { data: profile } = useNuxtData<ProfileDTO>("profile");

// --- Estado local do wizard ---
const currentStep = ref(1);
const totalSteps = 4;
const isSaving = ref(false);
const isDisconnecting = ref(false);

// Cópia local do perfil para editar no wizard
const localData = ref<Partial<ProfileDTO>>({});

watch(
  () => props.open,
  (val) => {
    if (val && profile.value) {
      const p = profile.value;
      localData.value = {
        company: p.company
          ? { ...p.company }
          : {
              taxId: "",
              legalName: "",
              tradeName: "",
              titleCard: "Dados da Empresa 2",
            },
        address: p.address
          ? { ...p.address }
          : {
              street: "",
              number: "",
              neighborhood: "",
              city: "",
              state: "",
              zip: "",
            },
        contact: p.contact
          ? JSON.parse(JSON.stringify(p.contact))
          : {
              phones: [{ number: "", isWhatsapp: true }],
              social: { instagram: "", youtube: "", facebook: "", twitter: "" },
            },
        brandConfig: p.brandConfig
          ? { ...p.brandConfig }
          : { logoUrl: "", primaryColor: "#3B82F6" },
      };
      currentStep.value = 1;
    }
  },
  { immediate: true },
);

const steps = [
  { id: 1, label: "Empresa", icon: Building2, title: "Empresa & Endereço" },
  { id: 2, label: "Contatos", icon: Phone, title: "Contatos & Redes" },
  { id: 3, label: "Visual", icon: Palette, title: "Visual & Integrações" },
  {
    id: 4,
    label: "Revisão",
    icon: ClipboardCheck,
    title: "Revisão & Finalização",
  },
];

const progressPercent = computed(() =>
  Math.round(((currentStep.value - 1) / (totalSteps - 1)) * 100),
);

// Validação universal de campos obrigatórios (ver useFormValidation.ts): os
// próprios campos Base* da etapa atual se auto-registram; valida antes de
// avançar/concluir e bloqueia se houver campo obrigatório vazio (borda
// vermelha + "Campo obrigatório" abaixo de cada campo, sem alerta separado).
const { validate, reset } = useFormValidation();

function nextStep() {
  if (!validate()) return;
  if (currentStep.value < totalSteps) {
    reset();
    currentStep.value++;
  }
}

function prevStep() {
  reset();
  if (currentStep.value > 1) currentStep.value--;
}

async function handleSkip() {
  try {
    await $fetch("/api/profile/setup-wizard", {
      method: "POST",
      body: { skip: true },
    });
    await refreshNuxtData("profile");
  } catch (e) {
    console.error("[SetupWizardModal] Erro ao registrar skip:", e);
  }
  notify(
    "Configuração Incompleta",
    "As configurações iniciais são necessárias para o funcionamento completo do sistema. Sem elas, funcionalidades como geração de PDF, agendamento e personalização de propostas podem não funcionar corretamente. Você pode continuar em Configurações a qualquer momento.",
  );
  emit("close");
}

async function handleFinish() {
  if (!validate()) return;
  isSaving.value = true;
  try {
    await $fetch("/api/profile/setup-wizard", {
      method: "POST",
      body: localData.value,
    });
    await refreshNuxtData("profile");
    notify("Sucesso", "Configurações salvas com sucesso! Bem-vindo ao Orcei.");
    emit("close");
  } catch {
    notify(
      "Erro",
      "Não foi possível salvar as configurações. Tente novamente.",
    );
  } finally {
    isSaving.value = false;
  }
}

// --- Integração Google ---
// Calendar e Drive são conectados separadamente (ver useGoogleConnect) —
// status de cada um depende do escopo realmente concedido, não só da
// presença de um refreshToken (que hoje é compartilhado entre os dois).
const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";
const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

function hasGoogleScope(scope: string) {
  return (
    !!profile.value?.googleIntegration?.refreshToken &&
    !!profile.value?.googleIntegration?.grantedScopes?.includes(scope)
  );
}

const isConnected = computed(
  () =>
    hasGoogleScope(GOOGLE_CALENDAR_SCOPE) || hasGoogleScope(GOOGLE_DRIVE_SCOPE),
);

// Resumo específico do que foi integrado (não basta dizer "Conectado" — o
// usuário pode ter conectado só Calendar, só Drive, os dois ou nenhum).
const googleIntegrationSummary = computed(() => {
  const calendar = hasGoogleScope(GOOGLE_CALENDAR_SCOPE);
  const drive = hasGoogleScope(GOOGLE_DRIVE_SCOPE);
  if (calendar && drive) return "Calendar e Drive conectados";
  if (calendar) return "Apenas Calendar conectado";
  if (drive) return "Apenas Drive conectado";
  return "Não conectado";
});

const isConnecting = ref(false);
const { connect } = useGoogleConnect();

async function handleConnect(feature: "drive" | "calendar") {
  isConnecting.value = true;
  try {
    const ok = await connect(feature);
    if (ok) {
      await refreshNuxtData("profile");
      notify("Sucesso", "Integração conectada com sucesso.");
    }
  } finally {
    isConnecting.value = false;
  }
}

async function handleDisconnect() {
  isDisconnecting.value = true;
  try {
    await $fetch("/api/integrations/google/disconnect", { method: "POST" });
    await refreshNuxtData("profile");
    notify("Sucesso", "Integração Google desconectada.");
  } catch {
    notify("Erro", "Não foi possível desconectar.");
  } finally {
    isDisconnecting.value = false;
  }
}

// --- Resumo (step 6) ---
const reviewItems = computed(() => [
  {
    label: "",
    type: "visual",
    value: localData.value.brandConfig,
  },
  {
    label: "Empresa",
    type: "text",
    value: localData.value.company?.tradeName
      ? `${localData.value.company.tradeName} — CNPJ: ${localData.value.company.taxId || "não informado"}`
      : "Não preenchido",
  },
  {
    label: "Endereço",
    type: "text",
    value: localData.value.address?.city
      ? `${localData.value.address.street || ""}, ${localData.value.address.city} - ${localData.value.address.state}`
      : "Não preenchido",
  },
  {
    label: "Telefone",
    type: "text",
    value: localData.value.contact?.phones?.[0]?.number || "Não preenchido",
  },
  {
    label: "Redes",
    type: "social",
    items: socialList.value, // ✅ CORRIGIDO: mudado de 'value' para 'items'
  },
  {
    label: "Integração Google",
    type: "text",
    value: googleIntegrationSummary.value,
  },
]);

const socialIconsMap: Record<string, any> = {
  instagram: Instagram,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
};

const socialList = computed(() => {
  const socialData = localData.value?.contact?.social || {};
  return Object.entries(socialData)
    .filter(
      ([_, handle]) =>
        handle && typeof handle === "string" && handle.trim() !== "",
    )
    .map(([network, handle]) => {
      const formattedHandle = handle.startsWith("@") ? handle : `@${handle}`;
      return {
        key: network,
        icon: socialIconsMap[network.toLowerCase()] || null,
        handle: formattedHandle,
      };
    });
});
</script>

<template>
  <!-- Overlay fullscreen -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      >
        <div
          class="bg-white dark:bg-gray-950 shadow-2xl overflow-hidden border-0 sm:border border-gray-200 dark:border-gray-800 rounded-none sm:rounded-2xl w-full h-[100dvh] sm:h-auto sm:w-auto flex flex-col"
        >
          <div class="w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[80vh] flex flex-col sm:flex-row flex-1 min-h-0">
            <div
              class="overflow-y-auto bg-gray-100 dark:bg-gray-800 w-2/5 border-r border-gray-200 dark:border-gray-800 hidden sm:block"
            >
              <div
                class="h-full px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex flex-col"
              >
                <!-- Header -->
                <div class="mb-6 space-y-4 flex-1">
                  <h2
                    class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-6"
                  >
                    Configuração Inicial
                  </h2>

                  <!-- Steps -->
                  <div class="">
                    <!-- Step indicators -->
                    <div class="hidden sm:flex flex-col gap-3">
                      <!-- Loop aplicado no contêiner de cada etapa -->
                      <div
                        v-for="step in steps"
                        :key="step.id"
                        class="flex items-center gap-2.5"
                      >
                        <!-- Ícone (À Esquerda) -->
                        <div
                          :class="[
                            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all',
                            currentStep > step.id
                              ? 'bg-emerald-500 text-white'
                              : currentStep === step.id
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600',
                          ]"
                        >
                          <CheckCircle2
                            v-if="currentStep > step.id"
                            class="w-4 h-4"
                          />
                          <component
                            v-else
                            :is="step.icon"
                            class="w-3.5 h-3.5"
                          />
                        </div>

                        <!-- Nome (À Direita) -->
                        <p
                          class="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight"
                        >
                          {{ step.label }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-[0.75rem] border border-blue-200/50 dark:border-blue-900/40"
                >
                  <p
                    class="text-xs font-light text-blue-700 dark:text-blue-100 tracking-tight"
                  >
                    Quase pronto! Complete o cadastro para sincronizar todas as
                    informações do seu negócio.
                  </p>
                </div>
              </div>
            </div>

            <div
              class="sm:w-4/5 w-full relative flex flex-col flex-1 min-h-0"
            >
              <!-- Header -->
              <div
                class="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 sm:hidden flex flex-col w-full gap-4 shrink-0 bg-white dark:bg-gray-950 z-50"
              >
                <!-- Linha superior: Título e Indicadores 100% -->
                <div class="flex items-center justify-between w-full">
                  <div class="flex flex-col w-full">
                    <h2
                      class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight"
                    >
                      Configuração Inicial
                    </h2>
                    <p
                      class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5"
                    >
                      Etapa {{ currentStep }} de {{ totalSteps }}
                    </p>

                    <!-- Step indicators -->
                    <div class="flex items-center gap-1.5 mt-6 justify-between">
                      <div
                        v-for="step in steps"
                        :key="step.id"
                        :class="[
                          'w-7 h-7 rounded-full flex items-center justify-center transition-all',
                          currentStep > step.id
                            ? 'bg-emerald-500 text-white'
                            : currentStep === step.id
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600',
                        ]"
                        :title="step.label"
                      >
                        <CheckCircle2
                          v-if="currentStep > step.id"
                          class="w-4 h-4"
                        />
                        <component v-else :is="step.icon" class="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Barra de progresso 100% -->
                <div
                  class="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden"
                >
                  <div
                    class="h-full bg-blue-500 rounded-full transition-all duration-500"
                    :style="{ width: progressPercent + '%' }"
                  />
                </div>
              </div>

              <!-- Conteúdo da etapa (scroll) -->
              <div class="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                <Transition
                  mode="out-in"
                  enter-active-class="transition-all duration-200 ease-out"
                  enter-from-class="opacity-0 translate-x-4"
                  enter-to-class="opacity-100 translate-x-0"
                  leave-active-class="transition-all duration-150 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0 -translate-x-4"
                >
                  <div :key="currentStep">
                    <!-- Step 1: Empresa & Endereço -->
                    <div v-if="currentStep === 1" class="space-y-8">
                      <SettingsCompany
                        v-if="localData.company"
                        v-model:company="localData.company"
                      />
                      <div>
                        <h3
                          class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4"
                        >
                          Endereço
                        </h3>
                        <SettingsAddress
                          v-if="localData.address"
                          v-model:address="localData.address"
                        />
                      </div>
                    </div>

                    <!-- Step 2: Contatos -->
                    <div v-else-if="currentStep === 2">
                      <SettingsContact
                        v-if="localData.contact"
                        v-model:contact="localData.contact"
                      />
                    </div>

                    <!-- Step 3: Visual & Integração Google -->
                    <div v-else-if="currentStep === 3" class="space-y-8">
                      <SettingsVisual
                        v-if="localData.brandConfig"
                        v-model:logoUrl="localData.brandConfig.logoUrl"
                        v-model:primaryColor="
                          localData.brandConfig.primaryColor
                        "
                      />
                      <div>
                        <h3
                          class="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4"
                        >
                          Integrações
                        </h3>
                        <div class="space-y-4">
                      <div
                        class="p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-[0.75rem] border border-gray-100 dark:border-gray-800"
                      >
                        <div class="flex items-center gap-4 mb-4">
                          <img
                            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                            class="w-8 h-8"
                            alt="Google"
                            loading="lazy"
                          />
                          <div>
                            <h3
                              class="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest"
                            >
                              Integração Google
                            </h3>
                            <p
                              class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5"
                            >
                              Conecte Drive e Calendar separadamente para
                              arquivamento e agendamento automático.
                            </p>
                          </div>
                        </div>

                        <div class="space-y-2">
                          <!-- Google Calendar -->
                          <div
                            class="flex items-center justify-between gap-3 p-3 bg-white dark:bg-gray-950 rounded-[0.75rem] border border-gray-100 dark:border-gray-800"
                          >
                            <span
                              class="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Google Calendar
                            </span>
                            <span
                              v-if="hasGoogleScope(GOOGLE_CALENDAR_SCOPE)"
                              class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200/50 dark:border-green-900/50"
                            >
                              <CheckCircle2 class="w-3 h-3 text-green-600 dark:text-green-400" /> Ativo
                            </span>
                            <BaseButton
                              v-if="!hasGoogleScope(GOOGLE_CALENDAR_SCOPE)"
                              variant="outline"
                              size="sm"
                              class="text-[10px]"
                              :loading="isConnecting"
                              @click="handleConnect('calendar')"
                            >
                              Conectar
                            </BaseButton>
                            <BaseButton
                              v-else
                              variant="ghost"
                              size="sm"
                              class="text-red-500 hover:text-red-700 text-[10px]"
                              :loading="isDisconnecting"
                              @click="handleDisconnect"
                            >
                              Desconectar
                            </BaseButton>
                          </div>

                          <!-- Google Drive -->
                          <div
                            class="flex items-center justify-between gap-3 p-3 bg-white dark:bg-gray-950 rounded-[0.75rem] border border-gray-100 dark:border-gray-800"
                          >
                            <span
                              class="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                            >
                              Google Drive
                            </span>
                            <span
                              v-if="hasGoogleScope(GOOGLE_DRIVE_SCOPE)"
                              class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-200/50 dark:border-green-900/50"
                            >
                              <CheckCircle2 class="w-3 h-3 text-green-600 dark:text-green-400" /> Ativo
                            </span>
                            <BaseButton
                              v-if="!hasGoogleScope(GOOGLE_DRIVE_SCOPE)"
                              variant="outline"
                              size="sm"
                              class="text-[10px]"
                              :loading="isConnecting"
                              @click="handleConnect('drive')"
                            >
                              Conectar
                            </BaseButton>
                            <BaseButton
                              v-else
                              variant="ghost"
                              size="sm"
                              class="text-red-500 hover:text-red-700 text-[10px]"
                              :loading="isDisconnecting"
                              @click="handleDisconnect"
                            >
                              Desconectar
                            </BaseButton>
                          </div>
                        </div>

                        <p
                          class="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center font-medium"
                        >
                          Esta etapa é opcional. Você pode conectar depois em
                          Configurações.
                        </p>
                      </div>
                        </div>
                      </div>
                    </div>

                    <!-- Step 4: Revisão -->
                    <div v-else-if="currentStep === 4" class="space-y-3">
                      <p
                        class="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-4"
                      >
                        Resumo das configurações
                      </p>
                      <!-- Aviso de itens incompletos -->
                      <div
                        v-if="
                          reviewItems.some((i) =>
                            i.type === 'text'
                              ? i.value === 'Não preenchido'
                              : i.type === 'social'
                                ? !i.items || i.items.length === 0
                                : !i.value?.logoUrl,
                          )
                        "
                        class="flex items-start gap-3 p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-[0.75rem] border border-amber-200/50 dark:border-amber-900/40 mt-4 align-top gap-3"
                      >
                        <AlertTriangle
                          class="w-10 h-10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                        />
                        <p
                          class="text-xs text-amber-700 dark:text-amber-300 font-medium leading-relaxed"
                        >
                          Algumas informações não foram preenchidas. Você pode
                          completá-las depois em <strong>Configurações</strong>.
                        </p>
                      </div>

                      <div
                        v-else
                        class="flex flex-row p-3 bg-green-50 dark:bg-green-950/30 rounded-[0.75rem] border border-green-200/50 dark:border-green-900/40 mb-4 items-center gap-3"
                      >
                        <CheckCircle2
                          class="w-10 h-10 text-green-600 dark:text-green-400 shrink-0 mt-0.5"
                        />
                        <div class="flex flex-col">
                          <h2
                            class="text-md mb-2 text-green-700 dark:text-green-400 font-medium"
                          >
                            Tudo pronto para finalizar a configuração!
                          </h2>
                          <p
                            class="text-xs text-green-700 dark:text-green-400 font-medium"
                          >
                            Revise abaixo os dados cadastrados. Você pode
                            alterar qualquer informação no futuro clicando em
                            <strong>Configurações</strong> no painel principal.
                          </p>
                        </div>
                      </div>

                      <div
                        v-for="item in reviewItems"
                        :key="item.label"
                        class="flex items-center justify-between gap-4 p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-[0.75rem] border border-gray-100 dark:border-gray-800"
                      >
                        <span
                          class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wide shrink-0"
                        >
                          {{ item.label }}
                        </span>

                        <!-- 1. Renderização para o Visual (Logo + Cor) -->
                        <div
                          v-if="item.type === 'visual'"
                          class="flex items-center gap-3 w-full"
                        >
                          <!-- Exibição da Logo com tratamento de fallback -->
                          <div class="flex items-center gap-1.5">
                            <img
                              v-if="item.value?.logoUrl"
                              :src="item.value.logoUrl"
                              alt="Logo"
                              class="w-10 h-10 rounded-[0.75rem] object-cover border border-gray-200 dark:border-gray-700"
                            />
                            <div
                              v-else
                              class="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] text-gray-500 font-bold"
                              title="Sem logo"
                            >
                              N/A
                            </div>
                          </div>

                          <!-- Amostra da Cor Primária + Hex -->
                          <div
                            class="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200/60 dark:border-gray-700/60"
                          >
                            <div
                              class="w-3.5 h-3.5 rounded-full shadow-sm border border-black/10"
                              :style="{
                                backgroundColor:
                                  item.value?.primaryColor || '#3B82F6',
                              }"
                            />
                            <span
                              class="text-xs font-mono font-bold text-gray-700 dark:text-gray-300"
                            >
                              {{ item.value?.primaryColor || "#3B82F6" }}
                            </span>
                          </div>
                        </div>

                        <!-- 2. Renderização para Redes Sociais -->
                        <div
                          v-else-if="item.type === 'social'"
                          class="flex flex-wrap justify-end gap-2"
                        >
                          <template v-if="item.items && item.items.length > 0">
                            <div
                              v-for="social in item.items"
                              :key="social.key"
                              class="flex items-center gap-1.5 text-xs font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200/60 dark:border-gray-700/60"
                            >
                              <component
                                :is="social.icon"
                                v-if="social.icon"
                                class="w-3.5 h-3.5 text-gray-500 dark:text-gray-400"
                              />
                              <span>{{ social.handle }}</span>
                            </div>
                          </template>
                          <span
                            v-else
                            class="text-xs text-gray-900 dark:text-gray-100 font-medium text-right"
                          >
                            Não preenchido
                          </span>
                        </div>

                        <!-- 3. Renderização Padrão (Texto) -->
                        <span
                          v-else
                          class="text-xs text-gray-900 dark:text-gray-100 font-medium text-right"
                        >
                          {{ item.value }}
                        </span>
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>
            </div>
          </div>

          <!-- Footer com ações -->
          <div
            class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 shrink-0"
          >
            <!-- Pular (só nas primeiras etapas) -->
            <button
              v-if="currentStep < totalSteps"
              class="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 font-bold underline underline-offset-2 transition-colors"
              @click="handleSkip"
            >
              Pular configuração
            </button>
            <div v-else class="flex-1" />

            <!-- Navegação -->
            <div class="flex items-center gap-2">
              <BaseButton
                v-if="currentStep > 1"
                variant="secondary"
                size="sm"
                @click="prevStep"
              >
                Voltar
              </BaseButton>
              <BaseButton
                v-if="currentStep < totalSteps"
                size="sm"
                @click="nextStep"
              >
                Próximo
              </BaseButton>
              <BaseButton
                v-else
                size="sm"
                :loading="isSaving"
                @click="handleFinish"
              >
                Concluir
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
