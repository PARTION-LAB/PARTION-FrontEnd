<script setup>
defineProps({
  activeView: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['navigate'])

function go(view) {
  emit('navigate', view)
}
</script>

<template>
  <header class="topbar">
    <button class="brand" type="button" @click="go('products')">Partion</button>
    <nav aria-label="주요 메뉴">
      <button
        type="button"
        :class="{ active: activeView === 'products' }"
        @click="go('products')"
      >
        상품
      </button>
      <button type="button">투자</button>
      <button type="button">거래</button>
      <button type="button">게시판</button>
      <button type="button">원장</button>
    </nav>
    <button class="nav-login-button" type="button" @click="go('auth')">
      <span>로그인</span>
      <strong>회원가입</strong>
    </button>
  </header>
</template>
