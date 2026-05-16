<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

const { loggedIn } = useUserSession()

// Redirect authenticated users to dashboard
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
      <div class="flex flex-col items-center mb-10 gap-3">
        <AppLogo size="md" />
        <p class="text-gray-500 text-sm">Faça login para continuar</p>
      </div>

      <a
        href="/api/auth/google"
        class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-gray-200 py-4 rounded-2xl font-bold transition text-gray-700"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
        Entrar com Google
      </a>

      <p class="mt-8 text-center text-xs text-gray-400 font-medium">
        Ao entrar, você concorda com os termos de uso do Orcei.
      </p>
    </div>
  </div>
</template>
