<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useUserSession()
const { autoStartForRoute } = useOnboarding()

async function tryAutoStart() {
  if (!loggedIn.value) return
  await nextTick()
  setTimeout(() => autoStartForRoute(route.path), 400)
}

onMounted(tryAutoStart)
watch(() => route.path, tryAutoStart)
</script>

<template><span v-if="false" /></template>
