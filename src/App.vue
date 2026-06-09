<script setup>
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
const router = useRouter()

const activeView = computed(() => route.meta.navKey || 'products')

function navigate(view) {
  router.push({ name: view })
}
</script>

<template>
  <AppHeader :active-view="activeView" @navigate="navigate" />
  <RouterView v-slot="{ Component }">
    <component :is="Component" @navigate="navigate" />
  </RouterView>
</template>
