<script setup>
import { computed, ref } from 'vue'

const emit = defineEmits(['navigate'])

const authMode = ref('login')

const isLogin = computed(() => authMode.value === 'login')
const title = computed(() => (isLogin.value ? '로그인하고 투자를 이어가세요' : '회원가입하고 투자를 시작하세요'))
const submitLabel = computed(() => (isLogin.value ? '로그인' : '회원가입'))
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <button class="auth-brand" type="button" @click="emit('navigate', 'products')">
        Partion
      </button>
      <p class="eyebrow">회원 인증</p>
      <h1>{{ title }}</h1>

      <div class="auth-tabs">
        <button
          type="button"
          :class="{ selected: isLogin }"
          :aria-pressed="isLogin"
          @click="authMode = 'login'"
        >
          로그인
        </button>
        <button
          type="button"
          :class="{ selected: !isLogin }"
          :aria-pressed="!isLogin"
          @click="authMode = 'signup'"
        >
          회원가입
        </button>
      </div>

      <form class="auth-form" @submit.prevent>
        <label v-if="!isLogin">
          <span>이름</span>
          <input type="text" autocomplete="name" />
        </label>
        <label>
          <span>이메일</span>
          <input type="email" autocomplete="email" />
        </label>
        <label>
          <span>비밀번호</span>
          <input
            type="password"
            :autocomplete="isLogin ? 'current-password' : 'new-password'"
          />
        </label>
        <button type="submit">{{ submitLabel }}</button>
      </form>

      <div class="social-login">
        <p>소셜 계정으로 계속하기</p>
        <button type="button"><span class="google">G</span>Google 로그인</button>
        <button type="button"><span class="kakao">K</span>Kakao 로그인</button>
        <button type="button"><span class="naver">N</span>Naver 로그인</button>
      </div>
    </section>
  </main>
</template>
