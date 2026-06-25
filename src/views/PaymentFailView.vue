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
    <section class="payment-result-panel is-error">
      <div class="payment-result-header">
        <span class="payment-result-icon" aria-hidden="true"></span>
        <div>
          <p class="eyebrow">Payment</p>
          <h1>결제 실패</h1>
          <p class="payment-result-message">{{ message }}</p>
        </div>
      </div>

      <div class="payment-result-content">
        <dl class="payment-result-summary">
          <div>
            <dt>오류 코드</dt>
            <dd>{{ code }}</dd>
          </div>
        </dl>

        <div class="payment-result-actions">
          <RouterLink class="primary-link" :to="returnTarget">결제 요청 화면으로 돌아가기</RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>
