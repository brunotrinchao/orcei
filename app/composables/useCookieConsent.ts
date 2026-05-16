export function useCookieConsent() {
  const config = useRuntimeConfig()

  const sessionId = useLocalStorage('orcei:session-id', () => crypto.randomUUID())
  const consent = useLocalStorage<{ status: string; date: string } | null>('orcei:consent', null)

  const hasConsent = computed(() => consent.value?.status === 'accepted')
  const hasDecided = computed(() => consent.value !== null)

  function loadTracking() {
    const gtmId = config.public.gtmId
    const scripts: any[] = []
    const noscripts: any[] = []

    if (gtmId) {
      scripts.push({
        key: 'gtm',
        innerHTML: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
      })
      noscripts.push({
        key: 'gtm-noscript',
        innerHTML: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
        body: true,
        tagPosition: 'bodyOpen'
      })
    }

    // ContentSquare heatmap
    scripts.push({
      key: 'contentsquare',
      src: 'https://t.contentsquare.net/uxa/92683d36aa3ed.js',
      async: true,
      defer: true
    })

    useHead({ script: scripts, noscript: noscripts })
  }

  async function accept() {
    consent.value = { status: 'accepted', date: new Date().toISOString() }
    loadTracking()
    try {
      await $fetch('/api/consent', {
        method: 'POST',
        body: { sessionId: sessionId.value, status: 'accepted' }
      })
    } catch {}
  }

  async function reject() {
    consent.value = { status: 'rejected', date: new Date().toISOString() }
    try {
      await $fetch('/api/consent', {
        method: 'POST',
        body: { sessionId: sessionId.value, status: 'rejected' }
      })
    } catch {}
  }

  function resetConsent() {
    consent.value = null
  }

  function initTracking() {
    if (hasConsent.value) loadTracking()
  }

  return { hasConsent, hasDecided, accept, reject, resetConsent, initTracking }
}
