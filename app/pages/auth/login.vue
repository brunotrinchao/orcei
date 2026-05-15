<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

const { loggedIn } = useUserSession()
const { notify } = useAlerts()

const mode = ref<'login' | 'register'>('login')
const form = ref({
  name: '',
  email: '',
  password: ''
})

const isLoading = ref(false)

async function handleSubmit() {
  isLoading.value = true
  try {
    const endpoint = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register'
    await $fetch(endpoint, {
      method: 'POST',
      body: form.value
    })
    window.location.href = '/dashboard'
  } catch (e: any) {
    notify('Erro', e.data?.statusMessage || 'Erro na autenticação')
  } finally {
    isLoading.value = false
  }
}

// Se já estiver logado, manda pro dashboard
watchEffect(() => {
  if (loggedIn.value) {
    navigateTo('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div class="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
      <div class="text-center mb-10">
        <h1 class="text-3xl font-black text-blue-600 mb-2">Orcei</h1>
        <p class="text-gray-500">{{ mode === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta grátis' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div v-if="mode === 'register'">
          <label class="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
          <input v-model="form.name" required type="text" class="w-full p-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">E-mail</label>
          <input v-model="form.email" required type="email" class="w-full p-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 mb-1">Senha</label>
          <input v-model="form.password" required type="password" class="w-full p-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-blue-500 transition">
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition shadow-lg shadow-blue-100 disabled:opacity-50"
        >
          {{ isLoading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Cadastrar') }}
        </button>
      </form>

      <div class="mt-8 relative">
        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-100"></div></div>
        <div class="relative flex justify-center text-xs uppercase font-bold text-gray-400"><span class="bg-white px-4">Ou continue com</span></div>
      </div>

      <div class="mt-6">
        <a 
          href="/api/auth/google"
          class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-gray-200 py-3 rounded-2xl font-bold transition text-gray-700"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5">
          Google
        </a>
      </div>

      <p class="mt-10 text-center text-sm text-gray-500 font-medium">
        {{ mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?' }}
        <button 
          @click="mode = mode === 'login' ? 'register' : 'login'"
          class="text-blue-600 font-bold hover:underline ml-1"
        >
          {{ mode === 'login' ? 'Crie agora' : 'Faça login' }}
        </button>
      </p>
    </div>
  </div>
</template>

  </div>
</template>
