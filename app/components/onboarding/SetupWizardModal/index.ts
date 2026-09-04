import {
  Building2,
  UserPlus,
  BookOpen,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Palette,
  Plug,
  Calendar,
  HardDrive,
} from "lucide-vue-next";
import type { ProfileDTO } from "../../../../types";
import type { StepItem } from "../WizardStepHeader/index.vue";
import type { WizardClientData } from "../WizardClientStep/index.vue";
import type { WizardProductData } from "../WizardProductStep/index.vue";

export function useSetupWizardModal(props: { open: boolean }, emit: (e: "close") => void) {
  const { notify } = useAlerts();
  const { data: profile } = useLazyFetch<ProfileDTO>("/api/profile", { key: "profile" });
  const { user } = useUserSession();
  const { validate, reset } = useFormValidation();

  const userName = computed(() => profile.value?.name || (user.value as any)?.name || (user.value as any)?.email || "");

  // --- Integrações (etapa 4) ---
  const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events'
  const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
  const isConnecting = ref(false)

  function hasGoogleScope(scope: string) {
    return !!profile.value?.googleIntegration?.refreshToken
      && !!profile.value?.googleIntegration?.grantedScopes?.includes(scope)
  }

  const { connect } = useGoogleConnect()

  async function handleConnect(feature: 'drive' | 'calendar') {
    isConnecting.value = true
    try {
      const ok = await connect(feature)
      if (ok) await refreshNuxtData('profile')
    } finally {
      isConnecting.value = false
    }
  }

  // --- Estados do Fluxo ---
  const isWelcome = ref(true);
  const currentStep = ref(1);
  const totalSteps = 5;
  const isSaving = ref(false);
  const slideDirection = ref<'forward' | 'backward'>('forward');

  // Estados da Tela de Processamento Final
  const isProcessing = ref(false);
  const processingProgress = ref(15);
  const processingStatusText = ref("Validando a configuração");
  const isProcessingComplete = ref(false);

  // Dados locais
  const localProfile = ref<Partial<ProfileDTO>>({
    company: {
      taxId: "",
      legalName: "",
      tradeName: "",
    },
    address: {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zip: "",
    },
    contact: {
      phones: [{ number: "", isWhatsapp: true }],
      social: { instagram: "", youtube: "", facebook: "", twitter: "" },
    },
    brandConfig: {
      logoUrl: "",
      primaryColor: "#3B82F6",
    },
  });

  const clientData = ref<WizardClientData>({
    name: "",
    email: "",
    phone: "",
    isWhatsapp: true,
    taxId: "",
    city: "",
    state: "",
  });

  const productData = ref<WizardProductData>({
    type: "service",
    name: "",
    price: 0,
    unit: "UN",
    description: "",
  });

  watch(
    [() => props.open, () => profile.value],
    ([val, p]) => {
      if (val && p) {
        localProfile.value = {
          company: {
            tradeName: p.company?.tradeName || "",
            legalName: p.company?.legalName || "",
            taxId: p.company?.taxId || "",
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
      }
    },
    { immediate: true, deep: true },
  );

  const steps: StepItem[] = [
    {
      id: 1,
      label: "Negócio",
      title: "Conte sobre o seu negócio",
      subtitle:
        "Defina como sua organização será identificada dentro do produto.",
      icon: Building2,
    },
    {
      id: 2,
      label: "Cliente",
      title: "Cadastre seu primeiro cliente",
      subtitle:
        "Informe os dados do seu cliente inicial para emissão de orçamentos.",
      icon: UserPlus,
    },
    {
      id: 3,
      label: "Produto",
      title: "Adicione um produto ou serviço",
      subtitle:
        "Cadastre o primeiro item do seu catálogo para agilizar suas propostas.",
      icon: BookOpen,
    },
    {
      id: 4,
      label: "Integrações",
      title: "Conecte seus serviços",
      subtitle:
        "Conecte o Google Drive para salvar os PDFs dos orçamentos e, Google Calendar sincronizar sua agenda de execuções.",
      icon: Plug,
    },
    {
      id: 5,
      label: "Revisão",
      title: "Revise suas configurações",
      subtitle:
        "Confirme as informações antes de finalizar o seu ambiente Orcei.",
      icon: ClipboardCheck,
    },
  ];

  function startWizard() {
    slideDirection.value = 'forward';
    isWelcome.value = false;
    currentStep.value = 1;
  }

  function nextStep() {
    if (!validate()) return;
    if (currentStep.value < totalSteps) {
      slideDirection.value = 'forward';
      reset();
      currentStep.value++;
    }
  }

  function prevStep() {
    reset();
    if (currentStep.value > 1) {
      slideDirection.value = 'backward';
      currentStep.value--;
    } else {
      slideDirection.value = 'backward';
      isWelcome.value = true;
    }
  }

  function goToStep(stepId: number) {
    if (stepId < currentStep.value) {
      slideDirection.value = 'backward';
      reset();
      currentStep.value = stepId;
    } else if (stepId > currentStep.value) {
      slideDirection.value = 'forward';
      reset();
      currentStep.value = stepId;
    }
  }

  async function handleFinish() {
    if (!validate()) return;

    // Regra: Google Drive é necessário para salvar os PDFs dos orçamentos
    if (!hasGoogleScope(GOOGLE_DRIVE_SCOPE)) {
      notify(
        'Integração necessária',
        'Conecte o Google Drive na etapa "Integrações" para salvar os PDFs dos orçamentos. A conexão leva menos de 1 minuto.'
      )
      goToStep(4)
      return
    }

    isSaving.value = true;
    isProcessing.value = true;
    processingProgress.value = 15;
    processingStatusText.value = "Validando a configuração";
    isProcessingComplete.value = false;

    try {
      // 1. Salva dados da empresa e marca wizard completo
      await $fetch("/api/profile/setup-wizard", {
        method: "POST",
        body: localProfile.value,
      });

      processingProgress.value = 45;
      processingStatusText.value = "Criando seu espaço";
      await new Promise((r) => setTimeout(r, 400));

      // 2. Se cadastrou cliente no wizard, cria via API
      if (clientData.value.name?.trim()) {
        try {
          await $fetch("/api/clients", {
            method: "POST",
            body: {
              name: clientData.value.name.trim(),
              email: clientData.value.email?.trim() || undefined,
              phone: clientData.value.phone?.replace(/\D/g, "") || undefined,
              isWhatsapp: clientData.value.isWhatsapp,
              taxId: clientData.value.taxId?.trim() || undefined,
              address:
                clientData.value.city || clientData.value.state
                  ? {
                      city: clientData.value.city,
                      state: clientData.value.state,
                    }
                  : undefined,
            },
          });
        } catch (e) {
          console.warn(
            "[SetupWizardModal] Erro ao cadastrar cliente inicial:",
            e,
          );
        }
      }

      processingProgress.value = 75;
      processingStatusText.value = "Aplicando permissões";
      await new Promise((r) => setTimeout(r, 400));

      // 3. Se cadastrou produto no catálogo no wizard, cria via API
      if (productData.value.name?.trim()) {
        try {
          const rawPrice =
            typeof productData.value.price === "string"
              ? parseFloat(
                  productData.value.price
                    .replace(/[R$\s.]/g, "")
                    .replace(",", "."),
                ) || 0
              : productData.value.price || 0;

          await $fetch("/api/catalog", {
            method: "POST",
            body: {
              type: productData.value.type || "service",
              name: productData.value.name.trim(),
              price: rawPrice,
              unit: productData.value.unit || "UN",
              description: productData.value.description?.trim() || undefined,
            },
          });
        } catch (e) {
          console.warn(
            "[SetupWizardModal] Erro ao cadastrar produto inicial:",
            e,
          );
        }
      }

      await refreshNuxtData("profile");

      // 4. Etapa Final 100%
      processingProgress.value = 100;
      processingStatusText.value = "Tudo pronto";
      isProcessingComplete.value = true;
      await new Promise((r) => setTimeout(r, 700));

      notify("Sucesso!", "Configuração inicial concluída com sucesso.");
      emit("close");
    } catch (e: any) {
      isProcessing.value = false;
      notify(
        "Erro",
        e?.data?.statusMessage ||
          "Não foi possível salvar a configuração inicial.",
      );
    } finally {
      isSaving.value = false;
    }
  }

  return {
    isWelcome,
    currentStep,
    totalSteps,
    isSaving,
    isProcessing,
    processingProgress,
    processingStatusText,
    isProcessingComplete,
    slideDirection,
    userName,
    localProfile,
    clientData,
    productData,
    steps,
    startWizard,
    nextStep,
    prevStep,
    goToStep,
    handleFinish,
    GOOGLE_CALENDAR_SCOPE,
    GOOGLE_DRIVE_SCOPE,
    isConnecting,
    hasGoogleScope,
    handleConnect,
    Plug,
    Calendar,
    HardDrive,
    Building2,
    UserPlus,
    BookOpen,
    ClipboardCheck,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Loader2,
    Palette
  };
}
