<script setup lang="ts">
import {
  Settings,
  ShieldAlert,
  FileText,
  Globe,
  Plus,
  Trash2,
  RefreshCcw,
  Save,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Cpu,
  Loader2,
} from "lucide-vue-next";

const { notify } = useAlerts();
const { user } = useUserSession();
if (process.client && user.value?.role !== "admin") {
  navigateTo("/dashboard");
}

const { data: settings, refresh } = useFetch<any>("/api/admin/settings");

const localSettings = ref<any>(null);

const DEFAULT_CREDIT_COSTS = {
  proposalSuggest: 1,
  catalogSuggest: 1,
  clientExtract: 1,
  generate: 1,
  analyzeReport: 1,
  proposalSend: 1,
};

watch(
  settings,
  (val) => {
    if (val) {
      localSettings.value = JSON.parse(JSON.stringify(val));
      if (!localSettings.value.landingPage) {
        localSettings.value.landingPage = {
          features: [],
          heroTitle: "",
          heroSubtitle: "",
        };
      }
      if (!localSettings.value.creditCosts) {
        localSettings.value.creditCosts = { ...DEFAULT_CREDIT_COSTS };
      } else {
        localSettings.value.creditCosts = {
          ...DEFAULT_CREDIT_COSTS,
          ...localSettings.value.creditCosts,
        };
      }
      if (
        localSettings.value.initialCredits === undefined ||
        localSettings.value.initialCredits === null
      ) {
        localSettings.value.initialCredits = 1;
      }
    }
  },
  { immediate: true },
);

const isSaving = ref(false);

async function saveSettings() {
  if (!localSettings.value) return;
  isSaving.value = true;
  try {
    await $fetch("/api/admin/settings", {
      method: "PUT",
      body: localSettings.value,
    });
    notify("Sucesso", "Configurações globais atualizadas!");
    refresh();
  } catch (e: any) {
    notify("Erro", e.data?.statusMessage || "Erro ao salvar configurações");
  } finally {
    isSaving.value = false;
  }
}

function addFeature() {
  localSettings.value.landingPage.features.push({
    title: "Nova Funcionalidade",
    description: "Descrição aqui...",
    icon: "Sparkles",
    enabled: true,
  });
}

function removeFeature(idx: number) {
  localSettings.value.landingPage.features.splice(idx, 1);
}

function moveFeature(idx: number, direction: "up" | "down") {
  const features = localSettings.value.landingPage.features;
  if (direction === "up" && idx > 0) {
    const temp = features[idx];
    features[idx] = features[idx - 1];
    features[idx - 1] = temp;
  } else if (direction === "down" && idx < features.length - 1) {
    const temp = features[idx];
    features[idx] = features[idx + 1];
    features[idx + 1] = temp;
  }
}

const activeTab = ref<"system" | "landing" | "credits" | "aiProviders">(
  "system",
);

// --- Telemetria de Provedores de IA (aba "Provedores de IA") ---
const {
  data: aiUsage,
  error: aiUsageError,
  pending: aiUsagePending,
  refresh: refreshAiUsage,
} = useLazyFetch<any>("/api/admin/ai-usage", {
  key: "admin-ai-usage",
  immediate: false,
});

let aiUsageInterval: ReturnType<typeof setInterval> | null = null;

function startAiUsagePolling() {
  refreshAiUsage();
  if (aiUsageInterval) clearInterval(aiUsageInterval);
  // Atualiza a cada 30s enquanto a aba estiver ativa.
  aiUsageInterval = setInterval(() => refreshAiUsage(), 30000);
}

function stopAiUsagePolling() {
  if (aiUsageInterval) {
    clearInterval(aiUsageInterval);
    aiUsageInterval = null;
  }
}

watch(activeTab, (tab) => {
  if (tab === "aiProviders") startAiUsagePolling();
  else stopAiUsagePolling();
});

onUnmounted(() => stopAiUsagePolling());

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Gemini",
  deepseek: "DeepSeek",
  cloudflare: "Cloudflare",
  openrouter: "OpenRouter",
};

const ACTION_LABELS: Record<string, string> = {
  proposalSuggest: "Sugestão de Orçamento",
  catalogSuggest: "Sugestão de Catálogo",
  clientExtract: "Extração de Lead",
  generate: "Geração de Texto",
  analyzeReport: "Relatório Estratégico",
};

function providerLabel(p: string) {
  return PROVIDER_LABELS[p] || p;
}

function actionLabel(a: string | null) {
  if (!a) return "—";
  return ACTION_LABELS[a] || a;
}

function formatUsd(v: number) {
  return `$${(v || 0).toFixed(4)}`;
}

function formatInt(v: number) {
  return new Intl.NumberFormat("pt-BR").format(v || 0);
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR");
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-10">
    <PageHeader
      title="Configurações da Plataforma"
      subtitle="Controle o estado do sistema, textos globais e visual da landpage."
    >
      <template #default>
        <div class="flex items-center gap-6">
          <NuxtLink
            to="/admin"
            class="text-xs font-black text-blue-600 hover:underline"
            >Voltar ao Painel</NuxtLink
          >
          <BaseButton
            @click="saveSettings"
            :disabled="isSaving"
            :loading="isSaving"
            class=""
          >
            <Save class="w-4 h-4 mr-2" />
            Salvar Alterações
          </BaseButton>
        </div>
      </template>
    </PageHeader>

    <div
      v-if="localSettings"
      class="flex flex-col lg:flex-row gap-12 items-start"
    >
      <!-- Tabs Sidebar -->
      <aside
        class="w-full lg:w-48 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide"
      >
        <button
          @click="activeTab = 'system'"
          :class="
            activeTab === 'system'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
          "
          class="flex items-center gap-3 px-6 py-4 rounded-[.5rem] text-xs font-black transition-all whitespace-nowrap lg:whitespace-normal text-left"
        >
          <ShieldAlert class="w-4 h-4 shrink-0" />
          Sistema
        </button>
        <button
          @click="activeTab = 'landing'"
          :class="
            activeTab === 'landing'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
          "
          class="flex items-center gap-3 px-6 py-4 rounded-[.5rem] text-xs font-black transition-all whitespace-nowrap lg:whitespace-normal text-left"
        >
          <Globe class="w-4 h-4 shrink-0" />
          Landing Page
        </button>
        <button
          @click="activeTab = 'credits'"
          :class="
            activeTab === 'credits'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
          "
          class="flex items-center gap-3 px-6 py-4 rounded-[.5rem] text-xs font-black transition-all whitespace-nowrap lg:whitespace-normal text-left"
        >
          <Sparkles class="w-4 h-4 shrink-0" />
          Créditos de IA
        </button>
        <button
          @click="activeTab = 'aiProviders'"
          :class="
            activeTab === 'aiProviders'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
          "
          class="flex items-center gap-3 px-6 py-4 rounded-[.5rem] text-xs font-black transition-all whitespace-nowrap lg:whitespace-normal text-left"
        >
          <Cpu class="w-4 h-4 shrink-0" />
          Provedores de IA
        </button>
      </aside>

      <!-- Content -->
      <div class="flex-1 space-y-10 min-w-0">
        <!-- SYSTEM SETTINGS -->
        <div
          v-if="activeTab === 'system'"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center"
              >
                <ShieldAlert class="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h2
                class="text-xl font-black text-gray-900 dark:text-white tracking-tight"
              >
                Estado do Sistema
              </h2>
            </div>

            <div
              class="p-8 bg-gray-50/50 dark:bg-gray-950/50 rounded-[.5rem] border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-6"
            >
              <div class="space-y-1">
                <h3
                  class="font-black text-gray-900 dark:text-gray-100 text-xs "
                >
                  Modo Manutenção
                </h3>
                <p
                  class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed"
                >
                  Quando ativado, apenas administradores poderão acessar as
                  rotas de dashboard. Usuários comuns verão uma página de
                  manutenção.
                </p>
              </div>
              <div
                @click="
                  localSettings.maintenanceMode = !localSettings.maintenanceMode
                "
                :class="
                  localSettings.maintenanceMode
                    ? 'bg-red-500'
                    : 'bg-gray-200 dark:bg-gray-800'
                "
                class="w-16 h-8 rounded-full relative cursor-pointer transition-colors duration-300 shrink-0"
              >
                <div
                  :class="
                    localSettings.maintenanceMode
                      ? 'translate-x-9'
                      : 'translate-x-1'
                  "
                  class="absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm"
                ></div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BaseInput
                v-model="localSettings.systemStatus.label"
                label="Rótulo de Status"
                placeholder="Ex: Operacional"
              />
              <BaseSelect
                v-model="localSettings.systemStatus.color"
                label="Cor do Status"
                :options="[
                  { label: 'Verde (Online)', value: 'green' },
                  { label: 'Amarelo (Instável)', value: 'yellow' },
                  { label: 'Vermelho (Offline)', value: 'red' },
                ]"
              />
            </div>
          </section>

          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center"
              >
                <FileText class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2
                class="text-xl font-black text-gray-900 dark:text-white tracking-tight"
              >
                Textos Globais
              </h2>
            </div>
            <div>
              <BaseTextarea
                v-model="localSettings.footerText"
                label="Texto do Rodapé (Footer)"
                :rows="3"
                placeholder="Texto do rodapé institucional..."
              />
            </div>
          </section>
        </div>

        <!-- LANDING PAGE SETTINGS -->
        <div
          v-if="activeTab === 'landing'"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center"
              >
                <Globe class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2
                class="text-xl font-black text-gray-900 dark:text-white tracking-tight"
              >
                Hero Section (Início)
              </h2>
            </div>
            <div class="space-y-6">
              <BaseInput
                v-model="localSettings.landingPage.heroTitle"
                label="Título Principal"
              />
              <BaseTextarea
                v-model="localSettings.landingPage.heroSubtitle"
                label="Subtítulo Hero"
                :rows="3"
                placeholder="Subtítulo chamativo da landing page..."
              />
            </div>
          </section>

          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center"
                >
                  <RefreshCcw
                    class="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <h2
                  class="text-xl font-black text-gray-900 dark:text-white tracking-tight"
                >
                  Funcionalidades
                </h2>
              </div>
              <BaseButton variant="secondary" size="sm" @click="addFeature">
                <Plus class="w-4 h-4 mr-1" /> Add Recurso
              </BaseButton>
            </div>

            <div class="grid grid-cols-1 gap-6">
              <div
                v-for="(f, idx) in localSettings.landingPage.features"
                :key="idx"
                class="p-6 bg-gray-50/50 dark:bg-gray-950/50 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4 relative group/feature"
              >
                <div class="flex justify-between items-start gap-4">
                  <!-- Reorder Controls -->
                  <div
                    class="flex items-center gap-2 absolute -left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover/feature:opacity-100 transition-all hidden lg:flex flex-col"
                  >
                    <button
                      @click="moveFeature(idx, 'up')"
                      :disabled="idx === 0"
                      class="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                      title="Mover para cima"
                    >
                      <ChevronUp class="w-4 h-4" />
                    </button>
                    <button
                      @click="moveFeature(idx, 'down')"
                      :disabled="
                        idx === localSettings.landingPage.features.length - 1
                      "
                      class="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-colors"
                      title="Mover para baixo"
                    >
                      <ChevronDown class="w-4 h-4" />
                    </button>
                  </div>

                  <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BaseInput v-model="f.title" label="Título" />
                    <BaseIconSelect v-model="f.icon" label="Ícone" />
                  </div>
                  <div class="flex items-center gap-2">
                    <!-- Mobile Reorder -->
                    <div class="flex lg:hidden items-center gap-1 mr-2">
                      <button
                        @click="moveFeature(idx, 'up')"
                        :disabled="idx === 0"
                        class="p-1.5 text-gray-400 disabled:opacity-30"
                      >
                        <ChevronUp class="w-4 h-4" />
                      </button>
                      <button
                        @click="moveFeature(idx, 'down')"
                        :disabled="
                          idx === localSettings.landingPage.features.length - 1
                        "
                        class="p-1.5 text-gray-400 disabled:opacity-30"
                      >
                        <ChevronDown class="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      @click="removeFeature(idx)"
                      class="p-2 text-red-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <BaseTextarea
                  v-model="f.description"
                  placeholder="Descrição do recurso..."
                  :rows="2"
                />
                <div class="flex items-center gap-3">
                  <BaseCheckbox v-model="f.enabled" :id="'f-enabled-' + idx" />
                  <label
                    :for="'f-enabled-' + idx"
                    class="text-[10px] font-black text-gray-400 cursor-pointer"
                    >Ativo na Landpage</label
                  >
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- CRÉDITOS DE IA -->
        <div
          v-if="activeTab === 'credits'"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center"
              >
                <Sparkles
                  class="w-5 h-5 text-violet-600 dark:text-violet-400"
                />
              </div>
              <h2
                class="text-xl font-black text-gray-900 dark:text-white tracking-tight"
              >
                Custo de Créditos por Ação
              </h2>
            </div>
            <p
              class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed"
            >
              Defina quantos créditos cada ação consome. Use 0 para tornar a
              ação gratuita — nesse caso, o saldo não é debitado e o rótulo de
              custo é ocultado nas telas do app.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-1.5">
                <BaseInput
                  v-model.number="localSettings.creditCosts.proposalSuggest"
                  type="number"
                  :label="actionLabel('proposalSuggest')"
                />
                <p
                  class="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1"
                >
                  Defina 0 para tornar a ação gratuita
                </p>
              </div>
              <div class="space-y-1.5">
                <BaseInput
                  v-model.number="localSettings.creditCosts.catalogSuggest"
                  type="number"
                  :label="actionLabel('catalogSuggest')"
                />
                <p
                  class="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1"
                >
                  Defina 0 para tornar a ação gratuita
                </p>
              </div>
              <div class="space-y-1.5">
                <BaseInput
                  v-model.number="localSettings.creditCosts.clientExtract"
                  type="number"
                  :label="actionLabel('clientExtract')"
                />
                <p
                  class="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1"
                >
                  Defina 0 para tornar a ação gratuita
                </p>
              </div>
              <div class="space-y-1.5">
                <BaseInput
                  v-model.number="localSettings.creditCosts.generate"
                  type="number"
                  :label="actionLabel('generate')"
                />
                <p
                  class="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1"
                >
                  Defina 0 para tornar a ação gratuita
                </p>
              </div>
              <div class="space-y-1.5">
                <BaseInput
                  v-model.number="localSettings.creditCosts.analyzeReport"
                  type="number"
                  :label="actionLabel('analyzeReport')"
                />
                <p
                  class="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1"
                >
                  Defina 0 para tornar a ação gratuita
                </p>
              </div>
              <div class="space-y-1.5">
                <BaseInput
                  v-model.number="localSettings.creditCosts.proposalSend"
                  type="number"
                  :label="actionLabel('proposalSuggest')"
                />
                <p
                  class="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1"
                >
                  Defina 0 para tornar a ação gratuita
                </p>
              </div>
            </div>
          </section>

          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center"
              >
                <Sparkles
                  class="w-5 h-5 text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <h2
                class="text-xl font-black text-gray-900 dark:text-white tracking-tight"
              >
                Créditos Iniciais
              </h2>
            </div>
            <p
              class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed"
            >
              Quantidade de créditos que um novo usuário recebe automaticamente
              ao se cadastrar na plataforma.
            </p>
            <div class="max-w-xs space-y-1.5">
              <BaseInput
                v-model.number="localSettings.initialCredits"
                type="number"
                label="Créditos no Cadastro"
              />
              <p
                class="text-[10px] text-gray-400 dark:text-gray-500 font-bold ml-1"
              >
                Defina 0 para não conceder créditos gratuitos
              </p>
            </div>
          </section>
        </div>

        <!-- PROVEDORES DE IA -->
        <div
          v-if="activeTab === 'aiProviders'"
          class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center"
                >
                  <Cpu class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2
                  class="text-xl font-black text-gray-900 dark:text-white tracking-tight"
                >
                  Provedores de IA
                </h2>
              </div>
              <button
                @click="refreshAiUsage()"
                class="flex items-center gap-2 text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline"
              >
                <RefreshCcw class="w-4 h-4" />
                Atualizar
              </button>
            </div>
            <p
              class="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed"
            >
              Cadeia de fallback fixa:
              <strong>DeepSeek → Gemini → Cloudflare → OpenRouter</strong>. Se
              um provedor habilitado falhar, o próximo da lista é tentado
              automaticamente. Ligue/desligue cada um pelas variáveis de
              ambiente <code class="font-mono">USE_DEEPSEEK</code>,
              <code class="font-mono">USE_GEMINI</code>,
              <code class="font-mono">USE_CLOUDFLARE</code>,
              <code class="font-mono">USE_OPENROUTER</code>. Telemetria de uso
              real, atualiza automaticamente a cada 30 segundos. O custo exibido
              é <strong>estimado</strong> a partir de uma tabela de preços
              pública por token — pode variar da fatura real do provedor.
            </p>

            <!-- Erro -->
            <div
              v-if="aiUsageError"
              class="p-6 rounded-[.5rem] border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-xs font-bold text-red-600 dark:text-red-400"
            >
              Não foi possível carregar a telemetria de IA:
              {{
                aiUsageError.data?.statusMessage ||
                aiUsageError.message ||
                "erro desconhecido"
              }}
            </div>

            <!-- Carregando (primeira vez) -->
            <div
              v-else-if="aiUsagePending && !aiUsage"
              class="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 py-6"
            >
              <Loader2 class="w-4 h-4 animate-spin" />
              Carregando telemetria...
            </div>

            <!-- Cards por provedor -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="p in aiUsage?.providers || []"
                :key="p.provider"
                class="p-6 rounded-[.5rem] border bg-gray-50/50 dark:bg-gray-950/50"
                :class="
                  (aiUsage?.enabledProviders || []).includes(p.provider)
                    ? 'border-blue-300 dark:border-blue-800'
                    : 'border-gray-100 dark:border-gray-800'
                "
              >
                <div class="flex items-center justify-between mb-4">
                  <h3
                    class="font-black text-gray-900 dark:text-gray-100 text-sm "
                  >
                    {{ providerLabel(p.provider) }}
                  </h3>
                  <span
                    v-if="aiUsage?.primaryProvider === p.provider"
                    class="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[9px] font-black uppercase tracking-widest"
                    >Principal</span
                  >
                  <span
                    v-else-if="
                      (aiUsage?.enabledProviders || []).includes(p.provider)
                    "
                    class="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] font-black uppercase tracking-widest"
                    >Fallback</span
                  >
                  <span
                    v-else
                    class="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-widest"
                    >Desligado</span
                  >
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p
                      class="text-[9px] text-gray-400 dark:text-gray-500 font-black "
                    >
                      Chamadas
                    </p>
                    <p class="text-lg font-black text-gray-900 dark:text-white">
                      {{ formatInt(p.totalCalls) }}
                    </p>
                    <p
                      class="text-[10px] text-gray-500 dark:text-gray-400 font-bold"
                    >
                      <span class="text-emerald-600 dark:text-emerald-400"
                        >{{ formatInt(p.successCalls) }} ok</span
                      >
                      <span class="mx-1">·</span>
                      <span class="text-red-500 dark:text-red-400"
                        >{{ formatInt(p.failedCalls) }} falha</span
                      >
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[9px] text-gray-400 dark:text-gray-500 font-black "
                    >
                      Custo estimado
                    </p>
                    <p class="text-lg font-black text-gray-900 dark:text-white">
                      {{ formatUsd(p.estimatedCostUsd) }}
                    </p>
                    <p
                      class="text-[10px] text-gray-400 dark:text-gray-500 font-bold"
                    >
                      estimativa
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[9px] text-gray-400 dark:text-gray-500 font-black "
                    >
                      Tokens (in / out)
                    </p>
                    <p class="text-sm font-black text-gray-900 dark:text-white">
                      {{ formatInt(p.totalTokensInput) }} /
                      {{ formatInt(p.totalTokensOutput) }}
                    </p>
                  </div>
                  <div>
                    <p
                      class="text-[9px] text-gray-400 dark:text-gray-500 font-black "
                    >
                      Última vez
                    </p>
                    <p
                      class="text-xs font-bold text-gray-700 dark:text-gray-300"
                    >
                      {{ formatDateTime(p.lastUsedAt) }}
                    </p>
                    <p
                      class="text-[10px] text-gray-400 dark:text-gray-500 font-bold"
                    >
                      {{ p.avgLatencyMs }}ms médio
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Chamadas recentes -->
          <section
            class="bg-white dark:bg-gray-900 p-8 rounded-[.5rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8"
          >
            <h3
              class="text-sm font-black text-gray-900 dark:text-white "
            >
              Chamadas Recentes
            </h3>

            <div
              v-if="(aiUsage?.recentCalls || []).length === 0"
              class="text-xs text-gray-400 dark:text-gray-500 font-bold py-6 text-center"
            >
              Nenhuma chamada registrada no período.
            </div>

            <div
              v-else
              class="w-full overflow-x-auto [-webkit-overflow-scrolling:touch]"
            >
              <table class="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr
                    class="text-[9px] text-gray-400 dark:text-gray-500 font-black border-b border-gray-100 dark:border-gray-800"
                  >
                    <th class="py-2 pr-4">Provedor</th>
                    <th class="py-2 pr-4">Modelo</th>
                    <th class="py-2 pr-4">Ação</th>
                    <th class="py-2 pr-4">Tokens</th>
                    <th class="py-2 pr-4">Custo</th>
                    <th class="py-2 pr-4">Status</th>
                    <th class="py-2 pr-4">Usuário</th>
                    <th class="py-2 pr-4">Quando</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="c in aiUsage?.recentCalls || []"
                    :key="c.id"
                    class="border-b border-gray-50 dark:border-gray-800/50 text-gray-700 dark:text-gray-300"
                  >
                    <td class="py-2.5 pr-4 font-black">
                      {{ providerLabel(c.provider) }}
                    </td>
                    <td
                      class="py-2.5 pr-4 font-medium text-gray-500 dark:text-gray-400"
                    >
                      {{ c.model }}
                    </td>
                    <td class="py-2.5 pr-4 font-medium">
                      {{ actionLabel(c.action) }}
                    </td>
                    <td class="py-2.5 pr-4 font-medium tabular-nums">
                      {{ formatInt(c.tokensInput) }} /
                      {{ formatInt(c.tokensOutput) }}
                    </td>
                    <td class="py-2.5 pr-4 font-medium tabular-nums">
                      {{ formatUsd(c.estimatedCostUsd) }}
                    </td>
                    <td class="py-2.5 pr-4">
                      <span
                        :class="
                          c.success
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-500 dark:text-red-400'
                        "
                        class="font-black text-[10px] "
                        >{{ c.success ? "OK" : "Falha" }}</span
                      >
                    </td>
                    <td
                      class="py-2.5 pr-4 font-medium text-gray-500 dark:text-gray-400"
                    >
                      {{ c.user?.email || "—" }}
                    </td>
                    <td
                      class="py-2.5 pr-4 font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
                    >
                      {{ formatDateTime(c.createdAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
