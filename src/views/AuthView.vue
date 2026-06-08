<script setup>
const emit = defineEmits(['navigate'])
</script>

<template>
  <main class="auth-page">
    <section class="auth-card">
      <button class="auth-brand" type="button" @click="emit('navigate', 'products')">
        Partion
      </button>
      <p class="eyebrow">회원 인증</p>
      <h1>로그인하고 투자를 이어가세요</h1>

      <div class="auth-tabs">
        <button type="button">로그인</button>
        <button type="button" class="selected">회원가입</button>
      </div>

      <form class="auth-form">
        <label>
          <span>이름</span>
          <input type="text" autocomplete="name" />
        </label>
        <label>
          <span>이메일</span>
          <input type="email" autocomplete="email" />
        </label>
        <label>
          <span>비밀번호</span>
          <input type="password" autocomplete="new-password" />
        </label>
        <button type="button">로그인</button>
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
