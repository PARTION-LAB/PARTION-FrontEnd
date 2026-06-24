<script setup>
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { logoutUser } from './api/auth'
import AiChatWidget from './components/AiChatWidget.vue'
import AppHeader from './components/layout/AppHeader.vue'
import { useAuth } from './composables/useAuth'
import { normalizeAuthRedirect } from './utils/authRedirect'

const route = useRoute()
const router = useRouter()
const { clearSession, isAuthenticated, user } = useAuth()

const activeView = computed(() => route.meta.navKey || 'products')

function navigate(view) {
  if (view && typeof view === 'object') {
    router.push(view)
    return
  }

  if (view === 'login') {
    const redirect = normalizeAuthRedirect(route.fullPath)

    router.push({
      name: 'login',
      query: redirect ? { redirect } : {},
    })
    return
  }

  router.push({ name: view })
}

async function logout() {
  try {
    await logoutUser()
  } catch (error) {
    console.warn(error.message || '로그아웃 API 호출에 실패했습니다.')
  } finally {
    clearSession()
    router.push({ name: 'products' })
  }
}
</script>

<template>
  <AppHeader
    :active-view="activeView"
    :is-authenticated="isAuthenticated"
    :user="user"
    @logout="logout"
    @navigate="navigate"
  />
  <RouterView v-slot="{ Component }">
    <component :is="Component" @navigate="navigate" />
  </RouterView>
  <AiChatWidget :is-authenticated="isAuthenticated" @navigate="navigate" />
</template>
