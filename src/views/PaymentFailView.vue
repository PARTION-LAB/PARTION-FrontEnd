<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const paymentReturnPathStorageKey = 'partionPaymentReturnPath'
const code = computed(() => route.query.code || '-')
const message = computed(() => route.query.message || '결제가 취소되었거나 실패했습니다.')
const returnTarget = computed(() => {
  const path = String(
    route.query.returnTo ||
      globalThis.sessionStorage.getItem(paymentReturnPathStorageKey) ||
      '/invest',
  )

  return path.startsWith('/') && !path.startsWith('//') ? path : '/invest'
})
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

      <div class="payment-result-actions">
        <RouterLink class="secondary-link" :to="returnTarget">결제 요청 화면으로 돌아가기</RouterLink>
      </div>
    </section>
  </main>
</template>
