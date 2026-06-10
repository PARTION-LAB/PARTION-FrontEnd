<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { confirmPayment, verifyPaymentAmount } from '../api/payments'
import { formatWon } from '../utils/formatters'

const route = useRoute()
const status = ref('pending')
const message = ref('결제 승인 정보를 확인하고 있습니다.')

const paymentKey = computed(() => String(route.query.paymentKey || ''))
const orderId = computed(() => String(route.query.orderId || ''))
const amount = computed(() => Number(route.query.amount || 0))

onMounted(async () => {
  try {
    await verifyPaymentAmount({
      orderId: orderId.value,
      amount: amount.value,
    })
    await confirmPayment({
      paymentKey: paymentKey.value,
      orderId: orderId.value,
      amount: amount.value,
    })
    status.value = 'success'
    message.value = '투자 결제가 완료되었습니다.'
  } catch (error) {
    status.value = 'error'
    message.value = error.message || '결제 승인 처리에 실패했습니다.'
  }
})
</script>

<template>
  <main class="payment-result-page">
    <section class="payment-result-panel">
      <p class="eyebrow">Payment</p>
      <h1>{{ status === 'success' ? '결제 완료' : '결제 확인 중' }}</h1>
      <p>{{ message }}</p>

      <dl class="order-summary">
        <div>
          <dt>주문 번호</dt>
          <dd>{{ orderId || '-' }}</dd>
        </div>
        <div>
          <dt>결제 금액</dt>
          <dd>
            <strong>{{ formatWon(amount) }}</strong>
          </dd>
        </div>
      </dl>

      <RouterLink class="secondary-link" :to="{ name: 'profile' }">내 투자 내역 보기</RouterLink>
    </section>
  </main>
</template>
