<script setup>
import { computed, ref } from 'vue'
import AppHeader from './components/layout/AppHeader.vue'
import AuthView from './views/AuthView.vue'
import BoardView from './views/BoardView.vue'
import HomeView from './views/HomeView.vue'
import InvestView from './views/InvestView.vue'
import MarketView from './views/MarketView.vue'
import RegisterProductView from './views/RegisterProductView.vue'

const activeView = ref('products')

const currentView = computed(() => {
  if (activeView.value === 'register') {
    return RegisterProductView
  }

  if (activeView.value === 'invest') {
    return InvestView
  }

  if (activeView.value === 'market') {
    return MarketView
  }

  if (activeView.value === 'board') {
    return BoardView
  }

  if (activeView.value === 'auth') {
    return AuthView
  }

  return HomeView
})

function navigate(view) {
  activeView.value = view
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <AppHeader :active-view="activeView" @navigate="navigate" />
  <component :is="currentView" @navigate="navigate" />
</template>
