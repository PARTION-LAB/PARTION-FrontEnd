<script setup>
import { ref } from 'vue'

defineProps({
  activeView: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const isMenuOpen = ref(false)

function go(view) {
  emit('navigate', view)
  isMenuOpen.value = false
}
</script>

<template>
  <header class="topbar">
    <button class="brand" type="button" @click="go('products')">Partion</button>
    <button
      class="menu-toggle"
      type="button"
      aria-controls="primary-navigation"
      :aria-expanded="isMenuOpen"
      aria-label="메뉴 열기"
      @click="isMenuOpen = !isMenuOpen"
    >
      <span></span>
      <span></span>
      <span></span>
    </button>
    <nav
      id="primary-navigation"
      aria-label="주요 메뉴"
      :class="{ open: isMenuOpen }"
    >
      <button
        type="button"
        :class="{ active: activeView === 'products' }"
        @click="go('products')"
      >
        상품
      </button>
      <button
        type="button"
        :class="{ active: activeView === 'invest' }"
        @click="go('invest')"
      >
        투자
      </button>
      <button
        type="button"
        :class="{ active: activeView === 'market' }"
        @click="go('market')"
      >
        거래
      </button>
      <button type="button">게시판</button>
      <button type="button">원장</button>
    </nav>
    <button class="nav-login-button" type="button" @click="go('auth')">
      <span>로그인</span>
      <strong>회원가입</strong>
    </button>
  </header>
</template>
