<script setup>
import { ref } from 'vue'

defineProps({
  activeView: {
    type: String,
    required: true,
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['logout', 'navigate'])
const isMenuOpen = ref(false)

function go(view) {
  emit('navigate', view)
  isMenuOpen.value = false
}

function logout() {
  emit('logout')
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
      <button
        type="button"
        :class="{ active: activeView === 'board' }"
        @click="go('board')"
      >
        게시판
      </button>
      <button
        type="button"
        :class="{ active: activeView === 'ledger' }"
        @click="go('ledger')"
      >
        원장
      </button>
    </nav>
    <div v-if="isAuthenticated" class="nav-user-area">
      <button class="nav-user-button" type="button" @click="go('profile')">
        내 정보
      </button>
      <button class="nav-logout-button" type="button" @click="logout">
        로그아웃
      </button>
    </div>
    <div v-else class="nav-auth-area">
      <button class="nav-login-button" type="button" @click="go('login')">
        로그인
      </button>
      <button class="nav-signup-button" type="button" @click="go('signup')">
        회원가입
      </button>
    </div>
  </header>
</template>
