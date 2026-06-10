<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const code = computed(() => route.query.code || '-')
const message = computed(() => route.query.message || '결제가 취소되었거나 실패했습니다.')
</script>

<template>
  <main class="payment-result-page">
    <section class="payment-result-panel">
      <p class="eyebrow">Payment</p>
      <h1>결제 실패</h1>
      <p>{{ message }}</p>

      <dl class="order-summary">
        <div>
          <dt>오류 코드</dt>
          <dd>{{ code }}</dd>
        </div>
      </dl>

      <RouterLink class="secondary-link" :to="{ name: 'invest' }">투자 페이지로 돌아가기</RouterLink>
    </section>
  </main>
</template>
